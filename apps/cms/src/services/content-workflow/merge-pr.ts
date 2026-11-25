import type { Payload } from 'payload'

import {
  getManagedPullRequest,
  mergePullRequestToBase,
} from '@repo/content/github'

export interface MergeContentPullRequestDependencies {
  getManagedPullRequest: typeof getManagedPullRequest
  mergePullRequestToBase: typeof mergePullRequestToBase
}

export interface MergeContentPullRequestInput {
  headSha: string
  payload: Payload
  pullRequestNumber: number
  user: { id: number }
}

export const SELF_MERGE_REFUSED_MESSAGE =
  'You edited this change, so someone else has to merge it. Ask another editor, or have a maintainer review and merge the PR on GitHub.'
export const UNKNOWN_AUTHOR_REFUSED_MESSAGE =
  'This change has no recorded author, so the CMS cannot merge it. A maintainer has to review and merge the PR on GitHub.'

const toUserId = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number')
    return String(value)
  if (value && typeof value === 'object' && 'id' in value)
    return toUserId(value.id)
  return null
}

export const getChangeRequestContributors = (
  changeRequest: Record<string, unknown>
): Set<string> =>
  new Set(
    [
      changeRequest.createdBy,
      ...(Array.isArray(changeRequest.contributors)
        ? changeRequest.contributors
        : []),
    ].flatMap((value) => toUserId(value) ?? [])
  )

export interface MergeContentPullRequestResult {
  contentChangeRequestId: string | number | null
  merged: boolean
  message: string
  pullRequestNumber: number
  pullRequestUrl: string
  sha: string | null
}

export const createMergeContentPullRequest =
  ({
    getManagedPullRequest,
    mergePullRequestToBase,
  }: MergeContentPullRequestDependencies) =>
  async (
    input: MergeContentPullRequestInput
  ): Promise<MergeContentPullRequestResult> => {
    const pr = await getManagedPullRequest(input.pullRequestNumber)
    if (pr.headSha !== input.headSha)
      throw new Error(
        'This PR has changed. Refresh the page and review it again.'
      )
    const {
      docs: [changeRequest],
    } = await input.payload.find({
      collection: 'content-change-requests',
      depth: 0,
      limit: 1,
      where: {
        pullRequestNumber: { equals: pr.number },
        branchName: { equals: pr.branchName },
        commitSha: { equals: input.headSha },
        status: { equals: 'open' },
      },
    })
    if (!changeRequest)
      throw new Error(
        'No matching open CMS change for this PR. Refresh the page and review it again.'
      )
    const contributors = getChangeRequestContributors(changeRequest)
    if (!contributors.size) throw new Error(UNKNOWN_AUTHOR_REFUSED_MESSAGE)
    if (contributors.has(String(input.user.id)))
      throw new Error(SELF_MERGE_REFUSED_MESSAGE)
    const result = await mergePullRequestToBase({
      pullRequestNumber: pr.number,
      branchName: pr.branchName,
      commitSha: input.headSha,
    })
    if (!result.merged) throw new Error(result.message)
    await input.payload.update({
      collection: 'content-change-requests',
      id: changeRequest.id,
      data: {
        commitSha: result.sha ?? undefined,
        status: 'merged',
        mergedBy: input.user.id,
        mergedAt: new Date().toISOString(),
      },
    })

    return {
      contentChangeRequestId: changeRequest.id,
      merged: result.merged,
      message: result.message,
      pullRequestNumber: result.pullRequestNumber,
      pullRequestUrl: result.pullRequestUrl,
      sha: result.sha,
    }
  }

export const mergeContentPullRequest = createMergeContentPullRequest({
  getManagedPullRequest,
  mergePullRequestToBase,
})
