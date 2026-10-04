import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildPublishStatus, type PublishRun } from '../publish-status'
import { createTriggerPublish, PublishBlockedError } from '../trigger-publish'
import { memoryReservations, run } from './fixtures'
import { DispatchUncertainError } from '../dispatch-error'

const setup = (dev: PublishRun[] = []) => {
  const dispatched: unknown[] = []
  const trigger = createTriggerPublish({
    reservations: memoryReservations(),
    loadStatus: async () => ({
      fetchedAt: '',
      status: buildPublishStatus({ dev, production: [] }),
    }),
    dispatch: async (...args) => {
      dispatched.push(args)
    },
  })
  return { trigger, dispatched }
}
describe('manual Jenkins publishing', () => {
  it('retains the reservation when the dispatch response is lost', async () => {
    const reservations = memoryReservations()
    const trigger = createTriggerPublish({
      reservations,
      loadStatus: async () => ({
        fetchedAt: '',
        status: buildPublishStatus({ dev: [], production: [] }),
      }),
      dispatch: async () => {
        throw new DispatchUncertainError(new Error('connection lost'))
      },
    })
    await assert.rejects(() => trigger('dev'), DispatchUncertainError)
    assert.ok(await reservations.read())
    await assert.rejects(() => trigger('dev'), PublishBlockedError)
  })
  it('rejects changed build history before dispatch', async () => {
    let reads = 0
    const trigger = createTriggerPublish({
      reservations: memoryReservations(),
      loadStatus: async () => ({
        fetchedAt: '',
        status: buildPublishStatus({
          dev: [run({ id: ++reads })],
          production: [],
        }),
      }),
      dispatch: async () => {
        assert.fail('must not dispatch')
      },
    })
    await assert.rejects(() => trigger('dev'), /history changed/)
  })
  it('allows the first staging build', async () => {
    const { trigger, dispatched } = setup()
    await trigger('dev')
    assert.deepEqual(dispatched, [['dev', undefined]])
  })
  it('requires a successful reviewed preview and rejects stale or missing approval', async () => {
    for (const [dev, approval] of [
      [[], 10],
      [[run()], undefined],
      [[run()], 9],
    ] as const) {
      const { trigger, dispatched } = setup([...dev])
      await assert.rejects(
        () => trigger('production', approval),
        PublishBlockedError
      )
      assert.deepEqual(dispatched, [])
    }
  })
  it('passes the reviewed build number to production', async () => {
    const { trigger, dispatched } = setup([run()])
    await trigger('production', 10)
    assert.deepEqual(dispatched, [['production', 10]])
  })
  it('serialises concurrent requests across instances and retains the reservation before queue visibility', async () => {
    const reservations = memoryReservations()
    let dispatched = 0
    const dependencies = {
      reservations,
      loadStatus: async () => ({
        fetchedAt: '',
        status: buildPublishStatus({ dev: [], production: [] }),
      }),
      dispatch: async () => {
        dispatched += 1
      },
    }
    const triggers = [
      createTriggerPublish(dependencies),
      createTriggerPublish(dependencies),
    ]
    const results = await Promise.allSettled(
      triggers.map((trigger) => trigger('dev'))
    )
    assert.equal(
      results.filter((result) => result.status === 'fulfilled').length,
      1
    )
    assert.equal(dispatched, 1)
    await assert.rejects(() => triggers[0]!('dev'), PublishBlockedError)
    assert.equal(dispatched, 1)
  })
  it('releases a failed dispatch so a retry can proceed', async () => {
    let fail = true
    const trigger = createTriggerPublish({
      reservations: memoryReservations(),
      loadStatus: async () => ({
        fetchedAt: '',
        status: buildPublishStatus({ dev: [], production: [] }),
      }),
      dispatch: async () => {
        if (fail) throw new Error('Jenkins rejected the request')
      },
    })
    await assert.rejects(() => trigger('dev'), /Jenkins rejected/)
    fail = false
    await trigger('dev')
  })
  it('rechecks fresh eligibility after acquiring the reservation', async () => {
    let reads = 0
    const reservations = memoryReservations()
    const trigger = createTriggerPublish({
      reservations,
      loadStatus: async () => ({
        fetchedAt: '',
        status: buildPublishStatus({
          dev: ++reads > 1 ? [run({ state: 'running', succeeded: false })] : [],
          production: [],
        }),
      }),
      dispatch: async () => {
        assert.fail('must not dispatch')
      },
    })
    await assert.rejects(() => trigger('dev'), PublishBlockedError)
    assert.equal(await reservations.read(), null)
  })
})
