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
          .map((doc) => ({
            status: 'open',
            pullRequestNumber: 123,
            createdBy: 1,
            contributors: [1],
            ...doc,
          }))
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
      user: { id: 2 },
    })

    assert.equal(result.contentChangeRequestId, 'ccr-1')
    assert.deepEqual(updates[0], {
      collection: 'content-change-requests',
      id: 'ccr-1',
      data: {
        commitSha: 'merge-sha',
        status: 'merged',
        mergedBy: 2,
        mergedAt: (updates[0] as { data: { mergedAt: string } }).data.mergedAt,
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
        user: { id: 2 },
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
      user: { id: 2 },
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
        user: { id: 2 },
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
        user: { id: 2 },
      }),
      /merge failed/
    )
    assert.equal(updates.length, 0)
  })

  const refusedMerge = async (
    doc: Record<string, unknown>,
    userId: number,
    message: RegExp
  ) => {
    const { payload, updates } = createPayload([
      {
        id: 'ccr-1',
        branchName: 'content/home',
        commitSha: 'saved-sha',
        ...doc,
      },
    ])
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
        user: { id: userId },
      }),
      message
    )
    assert.equal(updates.length, 0)
  }

  it('refuses a merge by the author', () =>
    refusedMerge({ createdBy: 1, contributors: [1] }, 1, /someone else/))

  it('refuses a merge by any editor who saved into the change', () =>
    refusedMerge({ createdBy: 1, contributors: [1, 2, 3] }, 2, /someone else/))

  it('reads the author from a populated relation', () =>
    refusedMerge(
      { createdBy: { id: 5 }, contributors: null },
      5,
      /someone else/
    ))

  it('refuses a change with no recorded author', () =>
    refusedMerge(
      { createdBy: null, contributors: null },
      2,
      /maintainer has to review and merge the PR on GitHub/
    ))
})
