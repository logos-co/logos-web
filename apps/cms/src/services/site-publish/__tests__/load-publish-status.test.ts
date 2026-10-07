import assert from 'node:assert/strict'
import { it } from 'node:test'
import { createLoadPublishStatus } from '../load-publish-status'
import { run } from './fixtures'

it('re-reads queue state instead of authorising against cached success', async () => {
  let queued = false
  const load = createLoadPublishStatus({
    listRuns: async (environment) =>
      environment === 'production'
        ? []
        : [run(queued ? { state: 'queued', succeeded: false } : {})],
  })
  assert.equal((await load()).status.production.canPublish, true)
  queued = true
  assert.equal((await load()).status.production.canPublish, false)
})
it('fails closed when GitHub Actions cannot be read', async () => {
  const load = createLoadPublishStatus({
    listRuns: async () => {
      throw new Error('GitHub Actions unavailable')
    },
  })
  await assert.rejects(load, /GitHub Actions unavailable/)
})
