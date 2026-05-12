import type { Payload } from 'payload'

import { mergePullRequestToBase } from '@repo/content/github'

type ChangeRequestDoc = {
  id: string | number
  pullRequestNumber?: number | null
  status?: string | null
}

export interface MergeContentPullRequestInput {
  payload: Payload
  pullRequestNumber: number
}

export interface MergeContentPullRequestResult {
  contentChangeRequestId: string | number
  merged: boolean
  message: string
  pullRequestNumber: number
  pullRequestUrl: string
  sha: string | null
}

const findChangeRequest = async ({
  payload,
  pullRequestNumber,
}: MergeContentPullRequestInput): Promise<ChangeRequestDoc> => {
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
  if (!doc) {
    throw new Error(`open content PR #${pullRequestNumber} was not found`)
  }

  return doc
}

export const mergeContentPullRequest = async (
  input: MergeContentPullRequestInput
): Promise<MergeContentPullRequestResult> => {
  const changeRequest = await findChangeRequest(input)
  const result = await mergePullRequestToBase({
    pullRequestNumber: input.pullRequestNumber,
  })

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
