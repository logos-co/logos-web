import { afterEach, describe, expect, test, vi } from 'vitest'

import type { BlogArticleDetail, BlogPodcastDetail } from '../blog-content'

const { contentMock } = vi.hoisted(() => ({
  contentMock: {
    getAllBlogArticles: vi.fn(),
    getAllBlogPodcasts: vi.fn(),
  },
}))

vi.mock('../blog-content', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../blog-content')>()),
  ...contentMock,
}))

import {
  getBroadcastEvents,
  getLatestBlogArticles,
  getLatestBlogPodcasts,
  getBlogPageData,
} from '../blog-engine'

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

const errorResponse = (status: number): Response =>
  ({
    ok: false,
    status,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    text: async () => 'Temporarily unavailable',
  }) as unknown as Response

const FETCH_INIT_JSON = {
  cache: 'force-cache',
  headers: { Accept: 'application/json' },
}

const FETCH_INIT_HTML = {
  cache: 'force-cache',
  headers: undefined,
}

const RETRY_DELAY_MS = 400

/**
 * Runs the retry backoff immediately so the suite does not sit through it,
 * while still recording the delay the code asked for.
 */
const stubRetryBackoff = () =>
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
    callback: () => void
  ) => {
    callback()
    return 0
  }) as unknown as typeof setTimeout)

afterEach(() => {
  vi.restoreAllMocks()
})

const CMS = 'https://cms-press.logos.co/uploads'

const article = (
  slug: string,
  overrides: Partial<BlogArticleDetail> = {}
): BlogArticleDetail =>
  ({
    type: 'article',
    id: slug,
    slug,
    title: slug,
    summary: `${slug} summary`,
    publishedAt: '2026-05-01T00:00:00.000Z',
    modifiedAt: null,
    createdAt: null,
    tags: [],
    authors: [{ id: '1', name: 'Logos' }],
    coverImage: { url: `${CMS}/${slug}.jpg`, alt: '', width: 0, height: 0 },
    readingTime: 4,
    toc: [],
    footnotes: [],
    relatedArticles: [],
    articlesFromSameAuthors: [],
    ...overrides,
  }) as BlogArticleDetail

const podcast = (
  slug: string,
  overrides: Partial<BlogPodcastDetail> = {}
): BlogPodcastDetail =>
  ({
    type: 'podcast',
    id: slug,
    slug,
    showSlug: 'logos-state',
    title: slug,
    summary: '',
    description: `<p>${slug} notes</p>`,
    publishedAt: '2026-04-01T00:00:00.000Z',
    modifiedAt: null,
    createdAt: null,
    tags: [],
    authors: [],
    coverImage: { url: `${CMS}/${slug}.png`, alt: '', width: 0, height: 0 },
    episodeNumber: 7,
    channels: [],
    credits: [],
    transcription: [],
    relatedEpisodes: [],
    footnotes: [],
    ...overrides,
  }) as BlogPodcastDetail

describe('getLatestBlogArticles', () => {
  test('lists published articles with a cover, newest first', async () => {
    contentMock.getAllBlogArticles.mockResolvedValue([
      article('older', { publishedAt: '2026-03-01T00:00:00.000Z' }),
      article('draft', { isDraft: true }),
      article('no-cover', { coverImage: null }),
      article('newest', { publishedAt: '2026-06-01T00:00:00.000Z' }),
      article('undated', { publishedAt: null }),
    ])

    const rows = await getLatestBlogArticles(2)

    expect(rows.map((row) => row.href)).toEqual([
      '/media/article/newest',
      '/media/article/older',
    ])
  })

  test('maps card images, dates and reading time from the article', async () => {
    contentMock.getAllBlogArticles.mockResolvedValue([
      article('june-2026', {
        title: 'State: June 2026',
        subtitle: '<b>Monthly</b> roundup',
        publishedAt: '2026-07-01T00:00:00.000Z',
        readingTime: 13,
        authors: [
          { id: '1', name: 'Ada' },
          { id: '2', name: 'Lin' },
        ],
      }),
    ])

    const [row] = await getLatestBlogArticles(1)

    expect(row).toEqual({
      title: 'State: June 2026',
      titleSerif: 'State:',
      date: '01 Jul 2026',
      galleryDate: '07.01.26',
      author: 'Ada, Lin',
      description: 'Monthly roundup',
      image: `${CMS}/june-2026.jpg`,
      thumbnailImage: `${CMS}/thumbnail_june-2026.jpg`,
      galleryImage: `${CMS}/small_june-2026.jpg`,
      cardImage: `${CMS}/june-2026.jpg`,
      featuredImage: `${CMS}/june-2026.jpg`,
      href: '/media/article/june-2026',
      readingTime: 13,
    })
  })

  test('keeps only articles carrying the requested tag', async () => {
    contentMock.getAllBlogArticles.mockResolvedValue([
      article('storage', { tags: [{ id: '1', name: 'Storage' }] }),
      article('blockchain', { tags: [{ id: '2', name: 'Blockchain' }] }),
    ])

    const rows = await getLatestBlogArticles(4, 'blockchain')

    expect(rows.map((row) => row.href)).toEqual(['/media/article/blockchain'])
  })
})

describe('getBlogPageData', () => {
  test('returns every listable article and the latest episodes', async () => {
    contentMock.getAllBlogArticles.mockResolvedValue([
      article('a'),
      article('b', { coverImage: null }),
    ])
    contentMock.getAllBlogPodcasts.mockResolvedValue([podcast('ep-1')])

    const data = await getBlogPageData()

    expect(data.articles.map((row) => row.href)).toEqual(['/media/article/a'])
    expect(data.podcasts.map((row) => row.href)).toEqual([
      '/media/podcasts/logos-state/ep-1',
    ])
  })
})

describe('getLatestBlogPodcasts', () => {
  test('maps episodes onto their own show, newest first', async () => {
    contentMock.getAllBlogPodcasts.mockResolvedValue([
      podcast('old', { publishedAt: '2024-01-01T00:00:00.000Z' }),
      podcast('new', {
        showSlug: 'hashing-it-out',
        publishedAt: '2026-01-01T00:00:00.000Z',
      }),
      podcast('draft', { isDraft: true }),
    ])

    const rows = await getLatestBlogPodcasts(5)

    expect(rows).toEqual([
      {
        title: 'new',
        image: `${CMS}/new.png`,
        description: 'new notes',
        date: '01 Jan 2026',
        episodeNumber: 7,
        href: '/media/podcasts/hashing-it-out/new',
      },
      expect.objectContaining({ href: '/media/podcasts/logos-state/old' }),
    ])
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
