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
      isContentOnly: async () => undefined,
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
})
