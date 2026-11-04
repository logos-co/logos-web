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
}

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
