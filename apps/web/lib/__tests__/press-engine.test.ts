import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  getBroadcastEvents,
  getLatestPressArticles,
  getLatestPressPodcasts,
} from '../press-engine'

const articlePageHtml = (readingTime: number) => `
  <html>
    <body>
      <script id="__NEXT_DATA__" type="application/json">
        {"props":{"pageProps":{"data":{"data":{"readingTime":${readingTime}}}}}}
      </script>
    </body>
  </html>
`

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLatestPressArticles', () => {
  test('overfetches before image filtering and enriches stale reading times', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            posts: [
              {
                type: 'article',
                data: {
                  title: 'Missing image',
                  slug: 'missing-image',
                  publishedAt: '2026-05-10',
                },
              },
              {
                type: 'article',
                data: {
                  title: 'Article one',
                  slug: 'article-one',
                  publishedAt: '2026-05-09',
                  readingTime: 1,
                  coverImage: {
                    url: 'https://cms-press.logos.co/uploads/article-one.jpg',
                  },
                },
              },
              {
                type: 'podcast',
                data: {
                  title: 'Wrong type',
                  slug: 'wrong-type',
                  publishedAt: '2026-05-08',
                  coverImage: {
                    url: 'https://cms-press.logos.co/uploads/wrong-type.jpg',
                  },
                },
              },
              {
                type: 'article',
                data: {
                  title: 'Article two',
                  slug: 'article-two',
                  publishedAt: '2026-05-07',
                  coverImage: {
                    url: 'https://cms-press.logos.co/uploads/article-two.jpg',
                  },
                  readingTime: 5,
                  authors: [{ name: 'Logos' }],
                },
              },
            ],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => articlePageHtml(13),
      } as Response)

    const articles = await getLatestPressArticles(2)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://blog.logos.co/api/search?type=article&limit=6',
      { cache: 'force-cache' }
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://blog.logos.co/article/article-one',
      { cache: 'force-cache' }
    )
    expect(articles).toMatchObject([
      {
        title: 'Article one',
        href: 'https://blog.logos.co/article/article-one',
        readingTime: 13,
      },
      {
        title: 'Article two',
        href: 'https://blog.logos.co/article/article-two',
        readingTime: 5,
      },
    ])
  })
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
      'https://blog.logos.co/api/search?type=podcast&limit=1',
      { cache: 'force-cache' }
    )
    expect(podcasts).toEqual([
      {
        title: 'Federico Ast, Kleros: Decentralised Arbitration System',
        image: 'https://cms-press.logos.co/uploads/podcast.jpg',
        description: 'Actual podcast description',
        date: '18 Sept 2024',
        episodeNumber: 14,
        href: 'https://blog.logos.co/podcasts/logos-state/federico-ast-kleros',
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
