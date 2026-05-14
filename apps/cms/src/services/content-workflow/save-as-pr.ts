import {
  type FileChange,
  commitFiles,
  createBranch,
  createOrGetPullRequest,
  getGithubConfig,
} from '@repo/content/github'
import type { Payload } from 'payload'

import { buildContentBranchName } from './branch-naming'

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

/**
 * Single entry point that the Payload `Create PR` action calls.
 *
 *   1. Fork a fresh `content/...` branch off the configured base.
 *   2. Atomic-commit the JSON (and any media) into that branch.
 *   3. Open (or fetch existing) PR targeting the base branch.
 *   4. Upsert the `ContentChangeRequest` row that mirrors the PR state.
 *
 * Idempotent within a single editor save: re-running with the same identifier
 * + commit content produces a new branch (timestamp differs); re-running the
 * Create PR action against an existing CCR row should go through `commitToExistingBranch`
 * instead (4b.3 follow-up).
 */
export const saveAsPullRequest = async (
  input: SaveAsPullRequestInput
): Promise<SaveAsPullRequestResult> => {
  if (input.changes.length === 0) {
    throw new Error('saveAsPullRequest requires at least one file change')
  }

  const config = getGithubConfig()
  const targetPath = input.changes[0]!.path
  const existing = await input.payload.find({
    collection: 'content-change-requests',
    where: {
      and: [
        { targetPath: { equals: targetPath } },
        { status: { in: ['draft', 'open'] } },
      ],
    },
    sort: '-updatedAt',
    limit: 1,
  })

  const existingRequest = existing.docs[0]
  if (existingRequest) {
    if (!existingRequest.pullRequestNumber || !existingRequest.pullRequestUrl) {
      throw new Error(
        `open content change request ${existingRequest.id} is missing pull request metadata`
      )
    }

    const branchName = existingRequest.branchName
    const { commitSha } = await commitFiles({
      branch: branchName,
      message: input.commitMessage,
      changes: input.changes,
    })

    await input.payload.update({
      collection: 'content-change-requests',
      id: existingRequest.id,
      data: {
        status: 'open',
        commitSha,
      },
    })

    return {
      branchName,
      pullRequestNumber: existingRequest.pullRequestNumber,
      pullRequestUrl: existingRequest.pullRequestUrl,
      commitSha,
      contentChangeRequestId: existingRequest.id,
    }
  }

  const branchName = buildContentBranchName({
    contentType: input.contentType,
    identifier: input.identifier,
  })
  const baseBranch = config.prBaseBranch

  await createBranch({ newBranch: branchName, fromBranch: baseBranch })

  const { commitSha } = await commitFiles({
    branch: branchName,
    message: input.commitMessage,
    changes: input.changes,
  })

  // PR body intentionally omits editor identity. The internal CCR row
  // (created below) records `createdBy` for audit; surfacing the editor's
  // email on a public PR is PII leakage we explicitly avoid. The
  // `editor.email` and `editor.payloadAuditUrl` plumbing stays in the
  // input type for future internal uses (e.g. notification emails) but
  // never reaches the GitHub PR.
  const pr = await createOrGetPullRequest({
    branchName,
    title: input.prTitle,
    body: input.prBody ?? '',
    draft: input.draft ?? true,
  })

  const created = await input.payload.create({
    collection: 'content-change-requests',
    data: {
      contentType: input.contentType,
      targetPath,
      branchName,
      pullRequestNumber: pr.number,
      pullRequestUrl: pr.htmlUrl,
      status: 'open',
      commitSha,
      ...(input.editor?.payloadUserId !== undefined && {
        createdBy: input.editor.payloadUserId,
      }),
    },
  })

  return {
    branchName,
    pullRequestNumber: pr.number,
    pullRequestUrl: pr.htmlUrl,
    commitSha,
    contentChangeRequestId: created.id,
  }
}
