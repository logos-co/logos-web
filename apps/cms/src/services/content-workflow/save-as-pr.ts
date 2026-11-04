import {
  type FileChange,
  commitFiles,
  createBranch,
  createOrGetPullRequest,
  listManagedPullRequests,
  verifyContentDiff,
  getGithubConfig,
} from '@repo/content/github'
import type { Payload } from 'payload'

import {
  buildContentBranchName,
  sameContentRecordBranch,
} from './branch-naming'
import { collectReferencedCmsUploadChanges } from './media-file-changes'

export interface SaveAsPullRequestDependencies {
  buildContentBranchName: typeof buildContentBranchName
  collectReferencedCmsUploadChanges: typeof collectReferencedCmsUploadChanges
  commitFiles: typeof commitFiles
  createBranch: typeof createBranch
  createOrGetPullRequest: typeof createOrGetPullRequest
  listManagedPullRequests: typeof listManagedPullRequests
  verifyContentDiff: typeof verifyContentDiff
  getGithubConfig: typeof getGithubConfig
}

export interface SavePrEditor {
  email?: string
  payloadUserId?: string | number
  payloadAuditUrl?: string
}

export interface SaveContentAsPullRequestInput<TDoc> {
  doc: TDoc
  editor?: SavePrEditor
  payload: Payload
}

export const createContentUpdateSubject = ({
  scope,
  slug,
}: {
  scope: string
  slug: string
}): string => `content(${scope}): update ${slug}`

export const createContentDeleteSubject = ({
  scope,
  slug,
}: {
  scope: string
  slug: string
}): string => `content(${scope}): delete ${slug}`

export const createContentUpdatePrBody = ({
  displayName,
  contentLabel,
  details,
}: {
  displayName: string
  contentLabel: string
  details: string[]
}): string =>
  [
    `Updates the **${displayName}** ${contentLabel} fixture from the CMS Admin.`,
    '',
    ...details,
  ].join('\n')

export const createContentDeletePrBody = ({
  displayName,
  contentLabel,
  details,
}: {
  displayName: string
  contentLabel: string
  details: string[]
}): string =>
  [
    `Deletes the **${displayName}** ${contentLabel} fixture from the CMS Admin.`,
    '',
    ...details,
  ].join('\n')

export type SaveAsPullRequestInput = {
  /** Logical content type — used for branch naming and the CCR row. */
  contentType: string
  /**
   * Record identifier (slug or route) used in the branch name. The actual
   * file path is supplied in `changes`; this is for branch-naming only.
   */
  identifier: string
  /**
   * One or more file changes to commit in a single atomic GitHub commit.
   * The first change's `path` becomes the `targetPath` recorded on the
   * ContentChangeRequest row (used for lock queries).
   */
  changes: FileChange[]
  /** Single-line commit subject. */
  commitMessage: string
  /** PR title. Plan §9 PR Title Rules — should start with `content(scope):`. */
  prTitle: string
  /** PR body (markdown). The submitter line is appended automatically. */
  prBody?: string
  /** Open the PR as a draft (recommended for first-cut wiring). */
  draft?: boolean
  /**
   * Editor metadata. Surface code passes `req.user.email` etc. so the PR
   * description can attribute the change without writing the email into the
   * Git commit author (commits stay App-identity).
   */
  editor?: SavePrEditor
  /**
   * Override for tests / preview-only flows. Defaults to the Payload
   * instance the caller already holds. The payload arg is required so the
   * service can persist a `ContentChangeRequest` row.
   */
  payload: Payload
}

export type SaveAsPullRequestResult = {
  branchName: string
  pullRequestNumber: number
  pullRequestUrl: string
  commitSha: string
  contentChangeRequestId: string | number
}

const recordContentChangeRequest = async (
  input: SaveAsPullRequestInput & {
    branchName: string
    commitSha: string
    pullRequestNumber: number
    pullRequestUrl: string
    targetPath: string
  }
): Promise<string | number> => {
  const existing = await input.payload.find({
    collection: 'content-change-requests',
    where: {
      branchName: { equals: input.branchName },
    },
    sort: '-updatedAt',
    limit: 1,
  })

  const existingRequest = existing.docs[0]
  const data = {
    contentType: input.contentType,
    targetPath: input.targetPath,
    branchName: input.branchName,
    pullRequestNumber: input.pullRequestNumber,
    pullRequestUrl: input.pullRequestUrl,
    status: 'open',
    commitSha: input.commitSha,
    ...(input.editor?.payloadUserId !== undefined && {
      createdBy: input.editor.payloadUserId,
    }),
  }

  if (existingRequest) {
    await input.payload.update({
      collection: 'content-change-requests',
      id: existingRequest.id,
      data,
    })
    return existingRequest.id
  }

  const created = await input.payload.create({
    collection: 'content-change-requests',
    data,
  })
  return created.id
}

/**
 * Single entry point for repo-backed Payload saves.
 *
 *   1. Reuse an open PR for the target path when one exists.
 *   2. Otherwise fork a fresh `content/...` branch off the configured base.
 *   3. Atomic-commit the JSON and any referenced CMS uploads.
 *   4. Open or refresh the PR targeting the base branch.
 *   5. Upsert the `ContentChangeRequest` row that mirrors the PR state.
 */
export const createSaveAsPullRequest =
  ({
    buildContentBranchName,
    collectReferencedCmsUploadChanges,
    commitFiles,
    createBranch,
    createOrGetPullRequest,
    listManagedPullRequests,
    verifyContentDiff,
    getGithubConfig,
  }: SaveAsPullRequestDependencies) =>
  async (input: SaveAsPullRequestInput): Promise<SaveAsPullRequestResult> => {
    if (input.changes.length === 0) {
      throw new Error('saveAsPullRequest requires at least one file change')
    }

    const config = getGithubConfig()
    const targetPath = input.changes[0]!.path
    const mediaChanges = await collectReferencedCmsUploadChanges({
      changes: input.changes,
    })
    const changes = [...input.changes, ...mediaChanges]
    const branchName = buildContentBranchName({
      contentType: input.contentType,
      identifier: input.identifier,
      prefix: config.contentBranchPrefix,
    })
    const existing = await input.payload.find({
      collection: 'content-change-requests',
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      where: {
        targetPath: { equals: targetPath },
        status: { in: ['open', 'draft'] },
      },
    })
    const cached = existing.docs[0]
    const open = await listManagedPullRequests()
    const candidates = open.filter((pr) =>
      sameContentRecordBranch(pr.branchName, branchName)
    )
    if (
      cached &&
      !open.some(
        (pr) =>
          pr.number === cached.pullRequestNumber &&
          pr.branchName === cached.branchName
      )
    ) {
      await input.payload.update({
        collection: 'content-change-requests',
        where: {
          id: { equals: cached.id },
          updatedAt: { equals: cached.updatedAt },
        },
        data: { status: 'closed' },
      })
    }
    if (candidates.length > 1) {
      throw new Error(
        `multiple open pull requests for ${targetPath}; merge or close one before saving`
      )
    }
    const livePr = candidates[0]
    if (livePr) {
      const paths = await verifyContentDiff(livePr)
      const savedHead =
        cached?.branchName === livePr.branchName &&
        cached.pullRequestNumber === livePr.number &&
        cached.commitSha === livePr.headSha
      const recordPaths = new Set(changes.map((change) => change.path))
      if (
        paths.some(
          (path) =>
            !recordPaths.has(path) &&
            !(savedHead && path.startsWith('apps/web/public/cms/uploads/'))
        )
      ) {
        throw new Error(
          'This content PR includes changes to a different record'
        )
      }
    }
    const branch = livePr?.branchName ?? branchName
    const parent =
      livePr?.headSha ??
      (
        await createBranch({
          newBranch: branch,
          fromBranch: config.prBaseBranch,
        })
      ).sha
    const { commitSha } = await commitFiles({
      branch,
      expectedHeadSha: parent,
      message: input.commitMessage,
      changes,
    })

    // PR body intentionally omits editor identity. The internal CCR row
    // (created below) records `createdBy` for audit; surfacing the editor's
    // email on a public PR is PII leakage we explicitly avoid. The
    // `editor.email` and `editor.payloadAuditUrl` plumbing stays in the
    // input type for future internal uses (e.g. notification emails) but
    // never reaches the GitHub PR.
    const pr =
      livePr ??
      (await createOrGetPullRequest({
        branchName: branch,
        title: input.prTitle,
        body: input.prBody ?? '',
        draft: input.draft ?? true,
      }))

    const contentChangeRequestId = await recordContentChangeRequest({
      ...input,
      branchName: branch,
      commitSha,
      pullRequestNumber: pr.number,
      pullRequestUrl: pr.htmlUrl,
      targetPath,
    })

    return {
      branchName: branch,
      pullRequestNumber: pr.number,
      pullRequestUrl: pr.htmlUrl,
      commitSha,
      contentChangeRequestId,
    }
  }

export const saveAsPullRequest = createSaveAsPullRequest({
  buildContentBranchName,
  collectReferencedCmsUploadChanges,
  commitFiles,
  createBranch,
  createOrGetPullRequest,
  listManagedPullRequests,
  verifyContentDiff,
  getGithubConfig,
})
