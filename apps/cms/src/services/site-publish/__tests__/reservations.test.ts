import assert from 'node:assert/strict'
import { it } from 'node:test'
import { withPublishReservation } from '../reservations'
import { buildPublishStatus } from '../publish-status'
import { memoryReservations, run } from './fixtures'

it('keeps both buttons blocked until the reserved build becomes visible', async () => {
  const reservations = memoryReservations()
  await reservations.acquire('dev', 10)
  let builds = [run()]
  const load = withPublishReservation(
    async () => ({
      fetchedAt: '',
      status: buildPublishStatus({ dev: builds, production: [] }),
    }),
    reservations
  )
  assert.equal((await load()).status.dev.canPublish, false)
  assert.equal((await load()).status.production.canPublish, false)
  builds = [run({ id: -123, state: 'queued', succeeded: false })]
  assert.equal((await load()).status.dev.canPublish, false)
  assert.equal(await reservations.read(), null)
  builds = [run({ id: 11 })]
  assert.equal((await load()).status.production.canPublish, true)
})

it('recognises a new finished build even if polling missed the queue', async () => {
  const reservations = memoryReservations()
  await reservations.acquire('dev', 10)
  const load = withPublishReservation(
    async () => ({
      fetchedAt: '',
      status: buildPublishStatus({ dev: [run({ id: 11 })], production: [] }),
    }),
    reservations
  )
  assert.equal((await load()).status.dev.canPublish, true)
  assert.equal(await reservations.read(), null)
})

it('does not clear a newer reservation with an older request token', async () => {
  const reservations = memoryReservations()
  const first = await reservations.acquire('dev', 10)
  await reservations.release(first!.token)
  const next = await reservations.acquire('production', 20)
  await reservations.release(first!.token)
  assert.deepEqual(await reservations.read(), next)
})
