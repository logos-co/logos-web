import { afterEach, describe, expect, test, vi } from 'vitest'

import { getBroadcastEvents, getLatestPressPodcasts } from '../press-engine'

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLatestPressPodcasts', () => {
  test('maps podcast search results without inventing missing fields', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          posts: [
            {
              type: 'podcast',
              data: {
                title: 'Federico Ast, Kleros: Decentralised Arbitration System',
                slug: 'federico-ast-kleros',
                publishedAt: '2024-09-18',
                coverImage: {
                  url: 'https://cms-press.logos.co/uploads/podcast.jpg',
                },
                description: 'Actual podcast description',
                episodeNumber: 14,
              },
            },
          ],
        },
      }),
    } as Response)

    const podcasts = await getLatestPressPodcasts(1)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://press.logos.co/api/search?type=podcast&limit=1',
      { cache: 'force-cache' }
    )
    expect(podcasts).toEqual([
      {
        title: 'Federico Ast, Kleros: Decentralised Arbitration System',
        image: 'https://cms-press.logos.co/uploads/podcast.jpg',
        description: 'Actual podcast description',
        date: '18 Sept 2024',
        episodeNumber: 14,
        href: 'https://press.logos.co/podcasts/logos-state/federico-ast-kleros',
      },
    ])
    expect('duration' in podcasts[0]).toBe(false)
  })
})

describe('getBroadcastEvents', () => {
  test('keeps all calendar events and maps UTC event time to a local calendar date', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    } as Response)

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
})
