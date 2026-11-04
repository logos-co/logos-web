import type { Payload } from 'payload'

import { mergePullRequestToBase } from '@repo/content/github'

export interface MergeContentPullRequestDependencies {
  mergePullRequestToBase: typeof mergePullRequestToBase
}

type ChangeRequestDoc = {
  id: string | number
  pullRequestNumber?: number | null
  branchName?: string
  commitSha?: string | null
  status?: string | null
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

const findChangeRequest = async ({
  payload,
  pullRequestNumber,
}: MergeContentPullRequestInput): Promise<ChangeRequestDoc | null> => {
  const result = await payload.find({
    collection: 'content-change-requests',
    depth: 0,
    limit: 1,
    where: {
      pullRequestNumber: {
        equals: pullRequestNumber,
      },
      status: {
        equals: 'open',
      },
    },
  })

  const doc = result.docs[0] as unknown as ChangeRequestDoc | undefined
  return doc ?? null
}

export const createMergeContentPullRequest =
  ({ mergePullRequestToBase }: MergeContentPullRequestDependencies) =>
  async (
    input: MergeContentPullRequestInput
  ): Promise<MergeContentPullRequestResult> => {
    const changeRequest = await findChangeRequest(input)
    if (!changeRequest?.branchName || !changeRequest.commitSha) {
      throw new Error('No matching open CMS change for this PR')
    }
    if (changeRequest.commitSha !== input.headSha) {
      throw new Error(
        'This PR has changed. Refresh the page and review it again.'
      )
    }
    const result = await mergePullRequestToBase({
      pullRequestNumber: input.pullRequestNumber,
      branchName: changeRequest.branchName,
      commitSha: changeRequest.commitSha,
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
  mergePullRequestToBase,
})
