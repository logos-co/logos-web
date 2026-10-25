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
  getLatestBlogArticles,
  getLatestBlogPodcasts,
  getBlogPageData,
  getBlogArticleListing,
} from '../blog-engine'

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

describe('getBlogArticleListing', () => {
  test('preserves the searchable summary separately from the displayed subtitle', async () => {
    contentMock.getAllBlogArticles.mockResolvedValue([
      article('july-2025', {
        subtitle: 'Your roundup of recent developments',
        summary: '<p>Road to PSF arrives in <strong>Zanzibar</strong>.</p>',
      }),
    ])

    const [row] = await getBlogArticleListing()

    expect(row).toMatchObject({
      description: 'Your roundup of recent developments',
      summary: 'Road to PSF arrives in Zanzibar .',
    })
  })

  test('keeps the complete published archive, including articles without covers', async () => {
    const archive = Array.from({ length: 90 }, (_, index) =>
      article(`article-${index}`, {
        publishedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
        ...(index === 0 ? { coverImage: null } : {}),
      })
    )
    contentMock.getAllBlogArticles.mockResolvedValue([
      ...archive,
      article('draft', { isDraft: true }),
      article('undated', { publishedAt: null }),
    ])

    const rows = await getBlogArticleListing()

    expect(rows).toHaveLength(90)
    expect(new Set(rows.map((row) => row.href)).size).toBe(90)
    expect(rows[0].href).toBe('/media/article/article-89')
    expect(rows.at(-1)).toMatchObject({
      href: '/media/article/article-0',
      thumbnailImage: '',
    })
    expect(archive[0].slug).toBe('article-0')
  })
})

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
