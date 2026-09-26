import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import {
  __resetPublishStatusCacheForTests,
  createLoadPublishStatus,
  type LoadPublishStatusDependencies,
} from '../load-publish-status'
import type { WorkflowRun } from '../publish-status'

const devRun: WorkflowRun = {
  conclusion: 'success',
  display_title: 'publish-dev',
  html_url: 'https://github.com/logos-co/logos-web/actions/runs/1',
  id: 1,
  run_started_at: '2026-09-23T10:00:00.000Z',
  status: 'completed',
  updated_at: '2026-09-23T10:07:00.000Z',
}

const createDependencies = (
  overrides: Partial<LoadPublishStatusDependencies> = {}
): LoadPublishStatusDependencies => ({
  listPublicRuns: async () => [devRun],
  listRuns: async () => [devRun],
  now: () => 1_000,
  ...overrides,
})

beforeEach(() => {
  __resetPublishStatusCacheForTests()
})

describe('createLoadPublishStatus', () => {
  it('reads the runs as the Github App', async () => {
    const load = createLoadPublishStatus(createDependencies())

    const result = await load()

    assert.equal(result.source, 'app')
    assert.equal(result.status.dev.latestRun?.id, 1)
  })

  it('falls back to the public API when the app may not read runs', async () => {
    const load = createLoadPublishStatus(
      createDependencies({
        listRuns: async () => {
          throw new Error('Resource not accessible by integration')
        },
      })
    )

    const result = await load()

    assert.equal(result.source, 'public')
    assert.equal(result.status.dev.latestRun?.id, 1)
  })

  it('reports when neither way works instead of guessing', async () => {
    const load = createLoadPublishStatus(
      createDependencies({
        listPublicRuns: async () => {
          throw new Error('API rate limit exceeded')
        },
        listRuns: async () => {
          throw new Error('Resource not accessible by integration')
        },
      })
    )

    await assert.rejects(load, /API rate limit exceeded/)
  })

  it('serves a repeat call from cache, so polling stays within the rate limit', async () => {
    let calls = 0
    const load = createLoadPublishStatus(
      createDependencies({
        listRuns: async () => {
          calls += 1
          return [devRun]
        },
      })
    )

    await load()
    await load()

    assert.equal(calls, 1)
  })

  it('reads again once the cache is old', async () => {
    let calls = 0
    let clock = 1_000
    const load = createLoadPublishStatus(
      createDependencies({
        listRuns: async () => {
          calls += 1
          return [devRun]
        },
        now: () => clock,
      })
    )

    await load()
    clock += 60_000
    await load()

    assert.equal(calls, 2)
  })

  it('reads again right after a publish was triggered', async () => {
    let calls = 0
    const load = createLoadPublishStatus(
      createDependencies({
        listRuns: async () => {
          calls += 1
          return [devRun]
        },
      })
    )

    await load()
    __resetPublishStatusCacheForTests()
    await load()

    assert.equal(calls, 2)
  })
})
