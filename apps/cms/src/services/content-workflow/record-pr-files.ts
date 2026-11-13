import {
  isAllowedCmsUpload,
  type FileChange,
  type listManagedPullRequests,
} from '@repo/content/github'
import type { SaveAsPullRequestDependencies } from './save-as-pr'
import { getReferencedUploadPaths } from './media-file-changes'

type OpenPr = Awaited<ReturnType<typeof listManagedPullRequests>>[number]
const CMS_UPLOAD_DIR = 'apps/web/public/cms/uploads/'

interface RecordPr {
  pr: OpenPr
  diff: string[]
  blockedUploads: string[]
  mergeBase: string
}

interface CachedPr {
  id: string | number
  targetPath?: string | null
  branchName?: string | null
  pullRequestNumber?: number | null
  status?: string | null
  commitSha?: string | null
}

const recordSubject = (title: string) =>
  title.replace(/^(content\([^)]+\): )(?:update|delete) /, '$1')

export async function findRecordPullRequest(
  open: OpenPr[],
  paths: string[],
  branchStem: string,
  dependencies: Pick<
    SaveAsPullRequestDependencies,
    'compareContentFiles' | 'verifyContentDiff' | 'readContentJson'
  >,
  cached: CachedPr | undefined,
  title: string
) {
  const candidates: RecordPr[] = []
  for (const pr of open) {
    const comparison = await dependencies.compareContentFiles(pr)
    const matchesFile = comparison.files?.some(
      (file) =>
        paths.includes(file.filename) ||
        (file.previous_filename && paths.includes(file.previous_filename))
    )
    const keyedBranch = pr.branchName.startsWith(branchStem)
    const legacyMirror =
      !matchesFile &&
      !keyedBranch &&
      /-\d{8}-\d{4}$/.test(pr.branchName) &&
      cached?.status === 'open' &&
      cached.targetPath === paths[0] &&
      cached.branchName === pr.branchName &&
      cached.pullRequestNumber === pr.number &&
      cached.commitSha === pr.headSha &&
      ((pr.title && recordSubject(pr.title) === recordSubject(title)) ||
        pr.body?.split(/\r?\n/).includes(`- updates: \`${paths[0]}\``))
    if (!matchesFile && !keyedBranch && !legacyMirror) continue
    const diff = await dependencies.verifyContentDiff(pr, {
      comparison,
      allowLegacyUploads: true,
    })
    if (legacyMirror) {
      if (
        !diff.length ||
        !diff.every((path) => path.startsWith(CMS_UPLOAD_DIR))
      )
        continue
      const referenced = await referencedUploads(
        paths,
        pr.headSha,
        dependencies
      )
      if (!diff.every((path) => referenced.has(path)))
        throw new Error('This content PR includes an unrelated upload')
    }
    if (
      diff.some(
        (path) => !paths.includes(path) && !path.startsWith(CMS_UPLOAD_DIR)
      )
    ) {
      throw new Error('This content PR includes changes to a different record')
    }
    const blockedUploads = (comparison.files ?? [])
      .filter(
        ({ filename, status }) =>
          status !== 'removed' &&
          filename.startsWith(CMS_UPLOAD_DIR) &&
          !isAllowedCmsUpload(filename)
      )
      .map(({ filename }) => filename)
    candidates.push({
      pr,
      diff,
      blockedUploads,
      mergeBase: comparison.mergeBaseSha,
    })
  }
  if (candidates.length > 1) {
    throw new Error(
      `multiple open pull requests for ${paths[0]}; merge or close one before saving`
    )
  }
  return candidates[0]
}

export async function recoverRemovedUploads(
  candidate: RecordPr,
  paths: string[],
  mediaChanges: FileChange[],
  dependencies: Pick<
    SaveAsPullRequestDependencies,
    'readContentJson' | 'getFileBlobShas'
  >,
  hasMatchingMirror: boolean
): Promise<FileChange[]> {
  const retained = new Set(mediaChanges.map((change) => change.path))
  // A tracked draft can already contain an orphaned upload from an earlier save.
  // Only undo the changes that would still block its merge.
  const candidates = hasMatchingMirror
    ? candidate.blockedUploads
    : candidate.diff
  const orphaned = candidates.filter(
    (path) => path.startsWith(CMS_UPLOAD_DIR) && !retained.has(path)
  )
  if (!orphaned.length) return []
  if (!hasMatchingMirror) {
    const referenced = await referencedUploads(
      paths,
      candidate.pr.headSha,
      dependencies
    )
    if (orphaned.some((path) => !referenced.has(path)))
      throw new Error('This content PR includes an unrelated upload')
  }
  const blobs = await dependencies.getFileBlobShas(
    orphaned,
    candidate.mergeBase
  )
  return [...new Set(orphaned)].map((path): FileChange => {
    const blobSha = blobs.get(path)
    return blobSha ? { path, blobSha } : { path, deleted: true }
  })
}

async function referencedUploads(
  paths: string[],
  headSha: string,
  dependencies: Pick<SaveAsPullRequestDependencies, 'readContentJson'>
) {
  const previous = await Promise.all(
    paths.map(async (path) => ({
      path,
      content: JSON.stringify(
        await dependencies.readContentJson(path, headSha)
      ),
    }))
  )
  return new Set(
    getReferencedUploadPaths(previous).map((path) => 'apps/web/public' + path)
  )
}
