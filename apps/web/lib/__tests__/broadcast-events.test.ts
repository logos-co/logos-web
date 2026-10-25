import { afterEach, describe, expect, test, vi } from 'vitest'

import { getBroadcastEvents } from '../broadcast-events'

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const jsonResponse = (payload: unknown): Response => Response.json(payload)

afterEach(() => vi.restoreAllMocks())

describe('getBroadcastEvents', () => {
  test('keeps all calendar events and maps UTC event time to a local calendar date', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            date: '2026-04-30',
            time: '16:00',
            type: {
              label: 'Logos Weekly Update',
              value: 'logos-weekly-update',
            },
            guest: null,
            speakers: [],
            topic: null,
            notes: null,
            links: ['https://example.com/update', 'https://example.com/backup'],
          },
          {
            id: 2,
            date: '2024-01-01',
            time: '12:00',
            type: {
              label: 'Past Event',
              value: 'past-event',
            },
            guest: null,
            speakers: [],
            topic: 'Past event topic',
            notes: null,
            links: ['https://example.com/past'],
          },
        ],
      })
    )

    const events = await getBroadcastEvents()

    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({
      id: 2,
      calendarTitle: 'Past event topic',
    })
    expect(events[1]).toMatchObject({
      id: 1,
      calendarTitle: 'Logos Weekly Update',
      localDateKey: formatLocalDateKey(new Date(Date.UTC(2026, 3, 30, 16))),
      timeMinutes: 960,
      links: ['https://example.com/update', 'https://example.com/backup'],
      link: 'https://example.com/update',
    })
  })

  test('keeps the event detail fields and drops placeholder values', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        success: true,
        data: [
          {
            id: 3,
            date: '2026-10-13',
            time: '17:00',
            type: { label: 'λ X Space', value: 'x-space' },
            guest: ' Guest Name ',
            speakers: ['Speaker One', null, 'null', ' Speaker Two '],
            topic: 'null',
            notes: 'Bring questions',
            links: ['https://x.com/Logos_network', ' '],
          },
        ],
      })
    )

    const [event] = await getBroadcastEvents()

    expect(event).toMatchObject({
      typeLabel: 'λ X Space',
      topic: '',
      guest: 'Guest Name',
      speakers: ['Speaker One', 'Speaker Two'],
      notes: 'Bring questions',
      host: 'Speaker One, Speaker Two',
      links: ['https://x.com/Logos_network'],
    })
  })
})

describe('live calendar requests', () => {
  const event = {
    id: 272,
    date: '2026-10-26',
    time: '09:00',
    type: { label: 'λ Interview', value: 'interview' },
    guest: 'Nick Merril',
    speakers: [],
    topic: null,
    notes: '',
    links: ['https://www.youtube.com/watch?v=yxdZWtd3epE'],
  }

  test('reads additions, edits and removals from subsequent responses without caching', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [event] }))
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [{ ...event, topic: 'Updated topic' }],
        })
      )
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [] }))
    const controller = new AbortController()

    expect(await getBroadcastEvents(controller.signal)).toEqual([])
    expect(await getBroadcastEvents(controller.signal)).toEqual([
      expect.objectContaining({
        id: 272,
        guest: 'Nick Merril',
        localTimestamp: Date.UTC(2026, 9, 26, 9),
      }),
    ])
    expect(await getBroadcastEvents(controller.signal)).toEqual([
      expect.objectContaining({ id: 272, calendarTitle: 'Updated topic' }),
    ])
    expect(await getBroadcastEvents(controller.signal)).toEqual([])
    for (const [url, options] of fetch.mock.calls) {
      expect(url).toMatch(/\/calendar\/public$/)
      expect(options).toEqual({ cache: 'no-store', signal: controller.signal })
    }
  })

  test('deduplicates by id and orders by UTC start time', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        success: true,
        data: [event, { ...event, id: 273, time: '08:00' }, event],
      })
    )
    expect((await getBroadcastEvents()).map(({ id }) => id)).toEqual([273, 272])
  })

  test.each([
    { success: false, data: [] },
    { success: true },
    { success: true, data: [{ ...event, date: 'invalid' }] },
    { success: true, data: [{ ...event, type: null }] },
  ])(
    'rejects an invalid response instead of reporting an empty calendar: %j',
    async (payload) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(payload))
      await expect(getBroadcastEvents()).rejects.toThrow()
    }
  )

  test('rejects HTTP failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unavailable', { status: 503 })
    )
    await expect(getBroadcastEvents()).rejects.toThrow('503')
  })

  test('rejects non-JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>Unavailable</html>')
    )
    await expect(getBroadcastEvents()).rejects.toThrow()
  })

  test('propagates request cancellation', async () => {
    const error = new DOMException('Aborted', 'AbortError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)
    await expect(getBroadcastEvents()).rejects.toBe(error)
  })
})
