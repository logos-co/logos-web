import { afterEach, describe, expect, test, vi } from 'vitest'

import { getBroadcastEvents } from '../broadcast-events'
import snapshot from '../data/broadcast-events.snapshot.json'

afterEach(() => vi.restoreAllMocks())

describe('static broadcast events', () => {
  test('reads the captured events without contacting the backend', () => {
    const network = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Offline'))
    const events = getBroadcastEvents()

    expect(events).toHaveLength(snapshot.data.length)
    expect(network).not.toHaveBeenCalled()
  })

  test('uses UTC dates until hydration, regardless of the build timezone', () => {
    expect(
      getBroadcastEvents().every((event) => event.localDateKey === event.date)
    ).toBe(true)
  })

  test('orders the captured schedule by event time', () => {
    const events = getBroadcastEvents()
    expect(events.map(({ localTimestamp }) => localTimestamp)).toEqual(
      events
        .map(({ localTimestamp }) => localTimestamp)
        .toSorted((a, b) => a - b)
    )
  })
})
