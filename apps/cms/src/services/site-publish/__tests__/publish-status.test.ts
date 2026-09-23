import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildPublishStatus, type WorkflowRun } from '../publish-status'

const run = (overrides: Partial<WorkflowRun> = {}): WorkflowRun => ({
  conclusion: 'success',
  display_title: 'publish-dev',
  html_url: 'https://github.com/logos-co/logos-web/actions/runs/1',
  id: 1,
  run_started_at: '2026-09-23T10:00:00.000Z',
  status: 'completed',
  updated_at: '2026-09-23T10:08:00.000Z',
  ...overrides,
})

describe('buildPublishStatus', () => {
  it('reports no run for an environment that has never published', () => {
    const status = buildPublishStatus([])

    assert.equal(status.dev.latestRun, null)
    assert.equal(status.dev.canPublish, true)
    assert.equal(status.dev.siteUrl, 'https://dev.logos.co')
  })

  it('keeps only the newest run of each environment', () => {
    const status = buildPublishStatus([
      run({ id: 9, display_title: 'publish-production' }),
      run({ id: 8 }),
      run({ id: 7, conclusion: 'failure' }),
    ])

    assert.equal(status.dev.latestRun?.id, 8)
    assert.equal(status.production.latestRun?.id, 9)
  })

  it('ignores runs that are not a publish run', () => {
    const status = buildPublishStatus([run({ display_title: 'Test' })])

    assert.equal(status.dev.latestRun, null)
  })

  it('marks a queued or running publish as in flight and blocks a second one', () => {
    const status = buildPublishStatus([
      run({ conclusion: null, status: 'in_progress' }),
    ])

    assert.equal(status.dev.latestRun?.state, 'running')
    assert.equal(status.dev.canPublish, false)
    assert.equal(status.dev.blockedReason, 'A dev publish is already running.')
  })

  it('takes the estimate from the last publish that finished well', () => {
    const status = buildPublishStatus([
      run({ conclusion: null, id: 3, status: 'in_progress' }),
      run({ id: 2, updated_at: '2026-09-23T10:06:00.000Z' }),
    ])

    assert.equal(status.dev.estimatedDurationMs, 6 * 60 * 1000)
  })

  describe('publishing to production', () => {
    it('waits until dev has published successfully', () => {
      const status = buildPublishStatus([])

      assert.equal(status.production.canPublish, false)
      assert.equal(
        status.production.blockedReason,
        'Publish to dev first, so the change can be checked there.'
      )
    })

    it('stays blocked while the dev publish is still running', () => {
      const status = buildPublishStatus([
        run({ conclusion: null, status: 'in_progress' }),
      ])

      assert.equal(status.production.canPublish, false)
      assert.equal(
        status.production.blockedReason,
        'Wait for the dev publish to finish.'
      )
    })

    it('stays blocked when the dev publish failed', () => {
      const status = buildPublishStatus([run({ conclusion: 'failure' })])

      assert.equal(status.production.canPublish, false)
      assert.equal(
        status.production.blockedReason,
        'The last dev publish failed, so there is nothing checked to promote.'
      )
    })

    it('opens up once dev published successfully', () => {
      const status = buildPublishStatus([run()])

      assert.equal(status.production.canPublish, true)
      assert.equal(status.production.blockedReason, undefined)
    })

    it('blocks while production itself is publishing', () => {
      const status = buildPublishStatus([
        run(),
        run({
          conclusion: null,
          display_title: 'publish-production',
          id: 5,
          status: 'queued',
        }),
      ])

      assert.equal(status.production.latestRun?.state, 'queued')
      assert.equal(status.production.canPublish, false)
      assert.equal(
        status.production.blockedReason,
        'A production publish is already running.'
      )
    })
  })
})
