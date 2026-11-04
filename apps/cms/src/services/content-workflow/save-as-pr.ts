import {
  type FileChange,
  commitFiles,
  createBranchAtSha,
  getBranchSha,
  createOrGetPullRequest,
  listManagedPullRequests,
  verifyContentDiff,
  compareContentFiles,
  readContentJson,
  getFileBlobShas,
  getGithubConfig,
} from '@repo/content/github'
import type { Payload, PayloadRequest } from 'payload'

import { buildContentBranchName, contentBranchStem } from './branch-naming'
import { collectReferencedCmsUploadChanges } from './media-file-changes'

import { findRecordPullRequest, recoverRemovedUploads } from './record-pr-files'
import { withContentPathLock } from './content-transaction'
import { recordContentChangeRequest } from './record-content-change'

export class PublishedResourceMirrorError extends Error {}

export interface SaveAsPullRequestDependencies {
  withContentPathLock: typeof withContentPathLock
  readContentJson: typeof readContentJson
  getFileBlobShas: typeof getFileBlobShas
  compareContentFiles: typeof compareContentFiles
  recordContentChangeRequest: typeof recordContentChangeRequest
  buildContentBranchName: typeof buildContentBranchName
  collectReferencedCmsUploadChanges: typeof collectReferencedCmsUploadChanges
  commitFiles: typeof commitFiles
  createBranchAtSha: typeof createBranchAtSha
  getBranchSha: typeof getBranchSha
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
  req?: PayloadRequest
  doc: TDoc
  previousDoc?: TDoc
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

export type SaveAsPullRequestInput = (
  | { changes: FileChange[]; resourceList?: never }
  | {
      changes?: never
      resourceList: { path: string; apply: (parent: unknown) => FileChange }
    }
) & {
  req?: PayloadRequest
  /** Logical content type — used for branch naming and the CCR row. */
  contentType: string
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

const defaults = {
  withContentPathLock,
  buildContentBranchName,
  recordContentChangeRequest,
  collectReferencedCmsUploadChanges,
  commitFiles,
  createBranchAtSha,
  getBranchSha,
  createOrGetPullRequest,
  listManagedPullRequests,
  verifyContentDiff,
  compareContentFiles,
  readContentJson,
  getFileBlobShas,
  getGithubConfig,
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
  (overrides: Partial<SaveAsPullRequestDependencies> = {}) =>
  async (input: SaveAsPullRequestInput): Promise<SaveAsPullRequestResult> => {
    const dependencies = { ...defaults, ...overrides }
    const {
      buildContentBranchName,
      recordContentChangeRequest,
      collectReferencedCmsUploadChanges,
      commitFiles,
      createBranchAtSha,
      getBranchSha,
      createOrGetPullRequest,
      listManagedPullRequests,
      getGithubConfig,
    } = dependencies

    const paths = input.resourceList
      ? [input.resourceList.path]
      : input.changes.map((change) => change.path)
    const targetPath = paths[0]
    if (!targetPath)
      throw new Error('saveAsPullRequest requires at least one file change')
    const config = getGithubConfig()
    const branchInput = {
      contentType: input.contentType,
      targetPath,
      prefix: config.contentBranchPrefix,
    }
    const branchName = buildContentBranchName(branchInput)
    const persist = async (req?: PayloadRequest) => {
      const existing = await input.payload.find({
        collection: 'content-change-requests',
        req,
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
      const candidate = await findRecordPullRequest(
        open,
        paths,
        contentBranchStem(branchInput),
        dependencies,
        cached,
        input.prTitle
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
          req,
          where: {
            id: { equals: cached.id },
            updatedAt: { equals: cached.updatedAt },
          },
          data: { status: 'closed' },
        })
      }
      const livePr = candidate?.pr
      const branch = livePr?.branchName ?? branchName
      const parent =
        livePr?.headSha ?? (await getBranchSha(config.prBaseBranch))
      const contentChanges = input.resourceList
        ? [
            input.resourceList.apply(
              await dependencies.readContentJson(targetPath, parent)
            ),
          ]
        : input.changes
      const mediaChanges = await collectReferencedCmsUploadChanges({
        changes: contentChanges,
      })
      const changes = [...contentChanges, ...mediaChanges]
      if (
        candidate &&
        !(
          cached?.branchName === candidate.pr.branchName &&
          cached.pullRequestNumber === candidate.pr.number &&
          cached.commitSha === parent
        )
      ) {
        changes.push(
          ...(await recoverRemovedUploads(
            candidate,
            paths,
            mediaChanges,
            dependencies
          ))
        )
      }
      if (!livePr) await createBranchAtSha({ newBranch: branch, sha: parent })
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
        }).catch(async (error: unknown) => {
          const accepted = (await listManagedPullRequests()).find(
            (pr) => pr.branchName === branch && pr.headSha === commitSha
          )
          if (!accepted) throw error
          return accepted
        }))

      const contentChangeRequestId = await recordContentChangeRequest({
        ...input,
        req,
        parentSha: parent,
        branchName: branch,
        commitSha,
        pullRequestNumber: pr.number,
        pullRequestUrl: pr.htmlUrl,
        targetPath,
      }).catch((cause: unknown) => {
        if (!input.resourceList) throw cause
        throw new PublishedResourceMirrorError(
          `PR #${pr.number} was updated, but the CMS could not record its head.`,
          { cause }
        )
      })

      return {
        branchName: branch,
        pullRequestNumber: pr.number,
        pullRequestUrl: pr.htmlUrl,
        commitSha,
        contentChangeRequestId,
      }
    }
    return dependencies.withContentPathLock(
      input.payload,
      input.req,
      targetPath,
      persist,
      Boolean(input.resourceList)
    )
  }

export const saveAsPullRequest = createSaveAsPullRequest()
