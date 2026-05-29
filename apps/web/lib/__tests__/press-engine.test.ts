import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  getBroadcastEvents,
  getLatestPressArticles,
  getLatestPressPodcasts,
  getPressPageData,
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

const jsonResponse = (payload: unknown): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify(payload),
  }) as unknown as Response

const htmlResponse = (html: string): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    text: async () => html,
  }) as unknown as Response

const FETCH_INIT_JSON = {
  cache: 'force-cache',
  headers: { Accept: 'application/json' },
}

const FETCH_INIT_HTML = {
  cache: 'force-cache',
  headers: undefined,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLatestPressArticles', () => {
  test('overfetches before image filtering and enriches stale reading times', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
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
        })
      )
      .mockResolvedValueOnce(htmlResponse(articlePageHtml(13)))
      .mockResolvedValueOnce(htmlResponse(articlePageHtml(5)))

    const articles = await getLatestPressArticles(2)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://blog.logos.co/api/search?type=article&limit=6',
      FETCH_INIT_JSON
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://blog.logos.co/article/article-one',
      FETCH_INIT_HTML
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://blog.logos.co/article/article-two',
      FETCH_INIT_HTML
    )
    expect(articles).toMatchObject([
      {
        title: 'Article one',
        href: 'https://blog.logos.co/article/article-one',
        image: 'https://cms-press.logos.co/uploads/large_article-one.jpg',
        thumbnailImage:
          'https://cms-press.logos.co/uploads/thumbnail_article-one.jpg',
        galleryImage: 'https://cms-press.logos.co/uploads/small_article-one.jpg',
        cardImage: 'https://cms-press.logos.co/uploads/large_article-one.jpg',
        featuredImage: 'https://cms-press.logos.co/uploads/article-one.jpg',
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

describe('getPressPageData', () => {
  test('uses canonical article page reading times instead of stale search values', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input)

        if (url === 'https://blog.logos.co/api/search?type=article&limit=100') {
          return jsonResponse({
            data: {
              posts: [
                {
                  type: 'article',
                  data: {
                    title: 'Logos Dev Update: April 2026',
                    slug: 'developer-update-apr-2026',
                    publishedAt: '2026-05-06',
                    coverImage: {
                      url: 'https://cms-press.logos.co/uploads/dev-update.jpg',
                    },
                    readingTime: 1,
                  },
                },
              ],
            },
          })
        }

        if (url === 'https://blog.logos.co/api/search?type=podcast&limit=20') {
          return jsonResponse({
            data: {
              posts: [
                {
                  type: 'podcast',
                  data: {
                    title: 'Logos State',
                    slug: 'logos-state',
                    publishedAt: '2026-05-01',
                    coverImage: {
                      url: 'https://cms-press.logos.co/uploads/podcast.jpg',
                    },
                  },
                },
              ],
            },
          })
        }

        if (
          url === 'https://blog.logos.co/article/developer-update-apr-2026'
        ) {
          return htmlResponse(articlePageHtml(12))
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      })

    const data = await getPressPageData()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://blog.logos.co/article/developer-update-apr-2026',
      FETCH_INIT_HTML
    )
    expect(data.articles).toMatchObject([
      {
        title: 'Logos Dev Update: April 2026',
        readingTime: 12,
      },
    ])
  })
})

describe('getLatestPressPodcasts', () => {
  test('maps podcast search results without inventing missing fields', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
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
      })
    )

    const podcasts = await getLatestPressPodcasts(1)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://blog.logos.co/api/search?type=podcast&limit=1',
      FETCH_INIT_JSON
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
})
