import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildPublishStatus } from '../publish-status'
import { run } from './fixtures'

describe('Jenkins publish status', () => {
  it('allows the first preview but blocks live publishing', () => {
    const status = buildPublishStatus({ dev: [], production: [] })
    assert.equal(status.dev.canPublish, true)
    assert.equal(status.production.canPublish, false)
  })
  it('requires a successful latest preview with a snapshot', () => {
    for (const dev of [
      run({ succeeded: false }),
      run({ hasSnapshot: false }),
    ]) {
      assert.equal(
        buildPublishStatus({ dev: [dev, run()], production: [] }).production
          .canPublish,
        false
      )
    }
    assert.equal(
      buildPublishStatus({ dev: [run()], production: [] }).production
        .canPublish,
      true
    )
  })
  it('blocks both buttons while either job is queued or building', () => {
    for (const environment of ['dev', 'production'] as const) {
      for (const state of ['queued', 'running'] as const) {
        const status = buildPublishStatus({
          dev: [run()],
          production: [],
          [environment]: [run({ state, succeeded: false })],
        })
        assert.equal(status.dev.canPublish, false)
        assert.equal(status.production.canPublish, false)
      }
    }
  })
  it('uses the last successful duration even when the latest run failed', () => {
    const status = buildPublishStatus({
      dev: [run({ succeeded: false }), run()],
      production: [],
    })
    assert.equal(status.dev.estimatedDurationMs, 420_000)
  })
})
