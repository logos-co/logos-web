import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildPublishStatus, type WorkflowRun } from '../publish-status'
import {
  createTriggerPublish,
  PublishBlockedError,
  type TriggerPublishDependencies,
} from '../trigger-publish'

const successfulDevRun: WorkflowRun = {
  conclusion: 'success',
  display_title: 'publish-dev',
  html_url: 'https://github.com/logos-co/logos-web/actions/runs/1',
  id: 1,
  run_started_at: '2026-09-23T10:00:00.000Z',
  status: 'completed',
  updated_at: '2026-09-23T10:07:00.000Z',
}

const createDependencies = (
  runs: WorkflowRun[],
  overrides: Partial<TriggerPublishDependencies> = {}
): { dependencies: TriggerPublishDependencies; dispatched: string[] } => {
  const dispatched: string[] = []
  return {
    dependencies: {
      clearStatusCache: () => undefined,
      dispatch: async (environment) => {
        dispatched.push(environment)
      },
      loadStatus: async () => ({
        fetchedAt: '2026-09-23T10:10:00.000Z',
        source: 'app' as const,
        status: buildPublishStatus(runs),
      }),
      ...overrides,
    },
    dispatched,
  }
}

describe('createTriggerPublish', () => {
  it('starts a dev publish', async () => {
    const { dependencies, dispatched } = createDependencies([])
    const trigger = createTriggerPublish(dependencies)

    const result = await trigger('dev')

    assert.deepEqual(dispatched, ['dev'])
    assert.equal(result.environment, 'dev')
  })

  it('refuses production until dev published successfully', async () => {
    const { dependencies, dispatched } = createDependencies([])
    const trigger = createTriggerPublish(dependencies)

    await assert.rejects(
      () => trigger('production'),
      (error: unknown) => {
        assert.ok(error instanceof PublishBlockedError)
        assert.match(error.message, /Publish to dev first/)
        return true
      }
    )
    assert.deepEqual(dispatched, [])
  })

  it('starts a production publish once dev published successfully', async () => {
    const { dependencies, dispatched } = createDependencies([successfulDevRun])
    const trigger = createTriggerPublish(dependencies)

    await trigger('production')

    assert.deepEqual(dispatched, ['production'])
  })

  it('drops the cached status so the new run shows up', async () => {
    let cleared = 0
    const { dependencies } = createDependencies([], {
      clearStatusCache: () => {
        cleared += 1
      },
    })
    const trigger = createTriggerPublish(dependencies)

    await trigger('dev')

    assert.equal(cleared, 1)
  })
})
