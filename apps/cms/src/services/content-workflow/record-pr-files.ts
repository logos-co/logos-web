import type { FileChange, listManagedPullRequests } from '@repo/content/github'
import type { SaveAsPullRequestDependencies } from './save-as-pr'
import { getReferencedUploadPaths } from './media-file-changes'

type OpenPr = Awaited<ReturnType<typeof listManagedPullRequests>>[number]
interface RecordPr {
  pr: OpenPr
  diff: string[]
  mergeBase: string
}

export async function findRecordPullRequest(
  open: OpenPr[],
  paths: string[],
  branchStem: string,
  dependencies: Pick<
    SaveAsPullRequestDependencies,
    'compareContentFiles' | 'verifyContentDiff'
  >
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
    // Legacy names can collide. A matching diff is the ownership proof.
    if (!matchesFile && !keyedBranch) continue
    const diff = await dependencies.verifyContentDiff(pr, comparison)
    if (
      diff.some(
        (path) =>
          !paths.includes(path) &&
          !path.startsWith('apps/web/public/cms/uploads/')
      )
    ) {
      throw new Error('This content PR includes changes to a different record')
    }
    candidates.push({ pr, diff, mergeBase: comparison.mergeBaseSha })
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
  >
): Promise<FileChange[]> {
  const retained = new Set(mediaChanges.map((change) => change.path))
  const orphaned = candidate.diff.filter(
    (path) =>
      path.startsWith('apps/web/public/cms/uploads/') && !retained.has(path)
  )
  if (!orphaned.length) return []
  const previous = await Promise.all(
    paths.map(async (path) => ({
      path,
      content: JSON.stringify(
        await dependencies.readContentJson(path, candidate.pr.headSha)
      ),
    }))
  )
  const referenced = new Set(
    getReferencedUploadPaths(previous).map((path) => 'apps/web/public' + path)
  )
  for (const path of orphaned) {
    if (!referenced.has(path))
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
