import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createMergeContentPullRequest,
  type MergeContentPullRequestDependencies,
} from '../merge-pr'

const createPayload = (docs: Record<string, unknown>[] = []) => {
  const updates: unknown[] = []
  return {
    payload: {
      find: async ({
        where,
        limit,
      }: {
        where: Record<string, { equals: unknown }>
        limit: number
      }) => ({
        docs: docs
          .map((doc) => ({ status: 'open', pullRequestNumber: 123, ...doc }))
          .filter((doc: Record<string, unknown>) =>
            Object.entries(where).every(
              ([key, condition]) => doc[key] === condition.equals
            )
          )
          .slice(0, limit),
      }),
      update: async (input: unknown) => {
        updates.push(input)
        return input
      },
    },
    updates,
  }
}

const createDependencies = (
  overrides: Partial<MergeContentPullRequestDependencies> = {}
): MergeContentPullRequestDependencies => ({
  getManagedPullRequest: async (number) => ({
    number,
    branchName: 'content/home',
    headSha: 'saved-sha',
    baseSha: 'base',
    draft: false,
    nodeId: 'node',
    htmlUrl: 'url',
  }),
  mergePullRequestToBase: async ({ pullRequestNumber }) => ({
    merged: true,
    message: 'merged',
    pullRequestNumber,
    pullRequestUrl: `https://github.com/logos-co/logos-co/pull/${pullRequestNumber}`,
    readyForReview: true,
    sha: 'merge-sha',
  }),
  ...overrides,
})

describe('createMergeContentPullRequest', () => {
  it('marks the matching open content change request as merged', async () => {
    const { payload, updates } = createPayload([
      { id: 'ccr-1', branchName: 'content/home', commitSha: 'saved-sha' },
    ])
    const merge = createMergeContentPullRequest(createDependencies())

    const result = await merge({
      payload: payload as never,
      headSha: 'saved-sha',
      pullRequestNumber: 123,
    })

    assert.equal(result.contentChangeRequestId, 'ccr-1')
    assert.deepEqual(updates[0], {
      collection: 'content-change-requests',
      id: 'ccr-1',
      data: {
        commitSha: 'merge-sha',
        status: 'merged',
      },
    })
  })

  it('rejects an untracked PR before merging', async () => {
    const { payload, updates } = createPayload()
    const merge = createMergeContentPullRequest(
      createDependencies({
        mergePullRequestToBase: async () => assert.fail('must not merge'),
      })
    )
    await assert.rejects(
      merge({
        payload: payload as never,
        headSha: 'saved-sha',
        pullRequestNumber: 123,
      }),
      /No matching open CMS change/
    )
    assert.equal(updates.length, 0)
  })

  it('merges the live row even when older rows share its PR number or SHA', async () => {
    const { payload, updates } = createPayload([
      { id: 'stale', branchName: 'content/home-old', commitSha: 'old' },
      {
        id: 'wrong-branch',
        branchName: 'schema/other',
        commitSha: 'saved-sha',
      },
      { id: 'correct', branchName: 'content/home', commitSha: 'saved-sha' },
    ])
    const result = await createMergeContentPullRequest(createDependencies())({
      payload: payload as never,
      pullRequestNumber: 123,
      headSha: 'saved-sha',
    })
    assert.equal(result.contentChangeRequestId, 'correct')
    assert.equal(updates.length, 1)
  })

  it('requires the head shown to the editor even if the mirror has since advanced', async () => {
    const { payload } = createPayload([
      { id: 'ccr-1', branchName: 'content/home', commitSha: 'new-head' },
    ])
    const merge = createMergeContentPullRequest(
      createDependencies({
        mergePullRequestToBase: async () => assert.fail('must not merge'),
      })
    )
    await assert.rejects(
      merge({
        payload: payload as never,
        pullRequestNumber: 123,
        headSha: 'old-head',
      }),
      /Refresh/
    )
  })

  it('does not mutate Payload when GitHub merge fails', async () => {
    const { payload, updates } = createPayload([
      { id: 'ccr-1', branchName: 'content/home', commitSha: 'saved-sha' },
    ])
    const merge = createMergeContentPullRequest(
      createDependencies({
        mergePullRequestToBase: async () => {
          throw new Error('merge failed')
        },
      })
    )

    await assert.rejects(
      merge({
        payload: payload as never,
        headSha: 'saved-sha',
        pullRequestNumber: 123,
      }),
      /merge failed/
    )
    assert.equal(updates.length, 0)
  })
})
