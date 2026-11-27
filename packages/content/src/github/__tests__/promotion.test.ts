import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { setGithubConfig, type GithubConfig } from '../config'
import {
  createSyncProductionBranchToStaging,
  getBranchSyncLinks,
  getBranchSyncDecision,
  type BranchComparisonStatus,
  type SyncProductionDependencies,
} from '../promotion'

const decide = (status: BranchComparisonStatus, aheadBy = 1) =>
  getBranchSyncDecision({
    aheadBy,
    productionBranch: 'master',
    productionSha: 'master-sha',
    stagingBranch: 'develop',
    stagingSha: 'develop-sha',
    status,
  })

describe('getBranchSyncDecision', () => {
  it('allows fast-forward when staging is ahead of production', () => {
    const decision = decide('ahead', 3)

    assert.equal(decision.kind, 'fast-forward')
    assert.equal(decision.sha, 'develop-sha')
  })

  it('treats identical branch tips as already synced', () => {
    const decision = decide('identical', 0)

    assert.equal(decision.kind, 'already-synced')
    assert.equal(decision.sha, 'master-sha')
  })

  it('rejects diverged branches instead of forcing production', () => {
    const decision = decide('diverged', 2)

    assert.equal(decision.kind, 'blocked')
    assert.match(decision.reason, /diverged/)
  })

  it('rejects a stale staging branch', () => {
    const decision = decide('behind', 0)

    assert.equal(decision.kind, 'blocked')
    assert.match(decision.reason, /behind/)
  })
})

describe('getBranchSyncLinks', () => {
  it('builds GitHub compare and branch links', () => {
    const links = getBranchSyncLinks({
      owner: 'logos-co',
      productionBranch: 'master',
      repo: 'logos-co',
      stagingBranch: 'develop',
    })

    assert.equal(
      links.compareUrl,
      'https://github.com/logos-co/logos-co/compare/master...develop'
    )
    assert.equal(
      links.productionBranchUrl,
      'https://github.com/logos-co/logos-co/tree/master'
    )
    assert.equal(
      links.stagingBranchUrl,
      'https://github.com/logos-co/logos-co/tree/develop'
    )
  })
})

describe('syncProductionBranchToStaging', () => {
  setGithubConfig({
    owner: 'logos-co',
    repo: 'logos-web',
    stagingBranch: 'develop',
    productionBranch: 'master',
  } as GithubConfig)

  const createSync = (overrides: Partial<SyncProductionDependencies> = {}) => {
    const calls: string[] = []
    const sync = createSyncProductionBranchToStaging({
      compareProductionToStaging: async () => ({
        aheadBy: 2,
        productionBranch: 'master',
        productionSha: 'master-sha',
        stagingBranch: 'develop',
        stagingSha: 'develop-sha',
        status: 'ahead',
      }),
      createReleasePullRequest: async (input) => {
        calls.push(`release ${input.branchName}->${input.base}`)
        return { htmlUrl: 'https://github.com/pr/7', number: 7 }
      },
      fastForward: async ({ branch, sha }) => {
        calls.push(`fast-forward ${branch} ${sha}`)
      },
      compareCommits: async () => 'ahead',
      findReleasePullRequest: async () => null,
      getBranchSha: async () => 'develop-sha',
      isContentOnly: async () => undefined,
      listReviews: async () => [],
      ...overrides,
    })
    return { calls, sync }
  }

  it('fast-forwards production when the diff is content only', async () => {
    const { calls, sync } = createSync()
    const result = await sync()
    assert.deepEqual(calls, ['fast-forward master develop-sha'])
    assert.deepEqual(result.promotion, { kind: 'fast-forward' })
    assert.equal(result.updated, true)
  })

  it('opens a release PR instead of fast-forwarding code', async () => {
    const { calls, sync } = createSync({
      isContentOnly: async () => {
        throw new Error('not content')
      },
    })
    const result = await sync()
    assert.deepEqual(calls, ['release develop->master'])
    assert.deepEqual(result.promotion, {
      kind: 'release-pr',
      reason: 'code-changes',
      pullRequestNumber: 7,
      pullRequestUrl: 'https://github.com/pr/7',
    })
    assert.equal(result.updated, false)
  })

  it('falls back to a release PR on any fast-forward failure', async () => {
    const refusals: unknown[] = []
    const refusal = Object.assign(new Error('Resource not accessible'), {
      status: 403,
    })
    const { sync } = createSync({
      fastForward: async () => {
        throw refusal
      },
    })
    const result = await sync({
      onFastForwardRefused: (error) => refusals.push(error),
    })
    assert.equal(result.promotion?.kind, 'release-pr')
    assert.equal(
      result.promotion?.kind === 'release-pr' && result.promotion.reason,
      'fast-forward-refused'
    )
    assert.deepEqual(refusals, [refusal])
  })

  it('does nothing when the branches already match', async () => {
    const { calls, sync } = createSync({
      compareProductionToStaging: async () => ({
        aheadBy: 0,
        productionBranch: 'master',
        productionSha: 'same',
        stagingBranch: 'develop',
        stagingSha: 'same',
        status: 'identical',
      }),
    })
    const result = await sync()
    assert.deepEqual(calls, [])
    assert.equal(result.promotion, undefined)
  })

  describe('with an open release PR', () => {
    const releasePullRequest = {
      headSha: 'develop-sha',
      htmlUrl: 'https://github.com/pr/9',
      number: 9,
    }
    const ref = {
      pullRequestNumber: 9,
      pullRequestUrl: 'https://github.com/pr/9',
    }
    const approved = [
      {
        authorAssociation: 'MEMBER',
        commitId: 'develop-sha',
        reviewer: 'alice',
        state: 'APPROVED',
      },
    ]
    const withReleasePr = (
      overrides: Partial<SyncProductionDependencies> = {}
    ) =>
      createSync({
        findReleasePullRequest: async () => releasePullRequest,
        listReviews: async () => approved,
        isContentOnly: async () => {
          throw new Error('not content')
        },
        ...overrides,
      })

    it('fast-forwards master to an approved, current head', async () => {
      const { calls, sync } = withReleasePr()
      const result = await sync()
      assert.deepEqual(calls, ['fast-forward master develop-sha'])
      assert.deepEqual(result.promotion, {
        kind: 'release-pr-fast-forward',
        ...ref,
      })
      assert.equal(result.updated, true)
    })

    it('waits when the approval is for an older commit', async () => {
      const { calls, sync } = withReleasePr({
        listReviews: async () => [
          {
            authorAssociation: 'MEMBER',
            commitId: 'old-sha',
            reviewer: 'alice',
            state: 'APPROVED',
          },
        ],
      })
      const result = await sync()
      assert.deepEqual(calls, [])
      assert.deepEqual(result.promotion, { kind: 'release-pr-pending', ...ref })
    })

    it('ignores an approval from a reviewer without write access', async () => {
      const { calls, sync } = withReleasePr({
        listReviews: async () => [
          {
            authorAssociation: 'NONE',
            commitId: 'develop-sha',
            reviewer: 'outsider',
            state: 'APPROVED',
          },
        ],
      })
      const result = await sync()
      assert.deepEqual(calls, [])
      assert.deepEqual(result.promotion, { kind: 'release-pr-pending', ...ref })
    })

    it('releases on a maintainer approval despite an outsider review', async () => {
      const { calls, sync } = withReleasePr({
        listReviews: async () => [
          ...approved,
          {
            authorAssociation: 'FIRST_TIME_CONTRIBUTOR',
            commitId: 'develop-sha',
            reviewer: 'outsider',
            state: 'CHANGES_REQUESTED',
          },
        ],
      })
      await sync()
      assert.deepEqual(calls, ['fast-forward master develop-sha'])
    })

    it('waits while a reviewer still requests changes', async () => {
      const { calls, sync } = withReleasePr({
        listReviews: async () => [
          ...approved,
          {
            authorAssociation: 'MEMBER',
            commitId: 'old-sha',
            reviewer: 'bob',
            state: 'CHANGES_REQUESTED',
          },
          {
            authorAssociation: 'MEMBER',
            commitId: 'develop-sha',
            reviewer: 'bob',
            state: 'COMMENTED',
          },
        ],
      })
      const result = await sync()
      assert.deepEqual(calls, [])
      assert.equal(result.promotion?.kind, 'release-pr-pending')
    })

    it('uses the latest review of each reviewer', async () => {
      const { calls, sync } = withReleasePr({
        listReviews: async () => [
          {
            authorAssociation: 'MEMBER',
            commitId: 'old-sha',
            reviewer: 'bob',
            state: 'CHANGES_REQUESTED',
          },
          ...approved,
          {
            authorAssociation: 'MEMBER',
            commitId: 'develop-sha',
            reviewer: 'bob',
            state: 'APPROVED',
          },
        ],
      })
      await sync()
      assert.deepEqual(calls, ['fast-forward master develop-sha'])
    })

    it('waits when develop moved past the approved head', async () => {
      const { calls, sync } = withReleasePr({
        getBranchSha: async () => 'newer-sha',
      })
      const result = await sync()
      assert.deepEqual(calls, [])
      assert.equal(result.promotion?.kind, 'release-pr-pending')
    })

    it('refuses without merging when master is not an ancestor', async () => {
      const { calls, sync } = withReleasePr({
        compareCommits: async () => 'diverged',
      })
      const result = await sync()
      assert.deepEqual(calls, [])
      assert.equal(result.decision.kind, 'blocked')
      assert.equal(result.promotion, undefined)
      assert.equal(result.updated, false)
    })

    it('reports a refused fast-forward without opening another PR', async () => {
      const refusals: unknown[] = []
      const refusal = new Error('Protected branch')
      const { calls, sync } = withReleasePr({
        fastForward: async () => {
          throw refusal
        },
      })
      const result = await sync({
        onFastForwardRefused: (error) => refusals.push(error),
      })
      assert.deepEqual(calls, [])
      assert.deepEqual(result.promotion, { kind: 'release-pr-refused', ...ref })
      assert.deepEqual(refusals, [refusal])
    })
  })
})
