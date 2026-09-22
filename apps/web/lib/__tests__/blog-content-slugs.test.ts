import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAllBlogArticles,
  getBlogArticleSlugs,
  getBlogPodcastPaths,
  isPublishedPost,
} from '@/lib/blog-content'

const { envStub } = vi.hoisted(() => ({
  envStub: {
    NEXT_PUBLIC_API_MODE: undefined as string | undefined,
    NEXT_PUBLIC_ADMIN_ACID_API_URL: undefined as string | undefined,
    NEXT_PUBLIC_ASSETS_BASE_URL: undefined as string | undefined,
    SIMPLECAST_ACCESS_TOKEN: undefined as string | undefined,
    STRAPI_API_URL: undefined as string | undefined,
    STRAPI_GRAPHQL_URL: undefined as string | undefined,
    STRAPI_API_KEY: undefined as string | undefined,
  },
}))

vi.mock('@/lib/env', () => ({ env: envStub }))

const PAGE_SIZE = 100

const jsonResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(payload),
})

const strapiPostPage = (posts: Array<{ slug?: string; showSlug?: string }>) =>
  jsonResponse({
    data: {
      posts: {
        data: posts.map((post) => ({
          attributes: {
            slug: post.slug,
            podcast_show: post.showSlug
              ? { data: { attributes: { slug: post.showSlug } } }
              : null,
          },
        })),
      },
    },
  })

const range = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => `${prefix}-${index}`)

const useStrapi = () => {
  envStub.STRAPI_GRAPHQL_URL = 'https://cms-press.example/graphql'
  envStub.STRAPI_API_KEY = 'test-key'
}

beforeEach(() => {
  envStub.STRAPI_GRAPHQL_URL = undefined
  envStub.STRAPI_API_KEY = undefined
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('without Strapi credentials', () => {
  it('fails instead of reading the old blog', async () => {
    // blog.logos.co is being switched off, so there is no second source.
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getBlogArticleSlugs()).rejects.toThrow(
      /STRAPI_GRAPHQL_URL and STRAPI_API_KEY/
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('slug queries against Strapi', () => {
  it('walks the article archive one offset window at a time', async () => {
    useStrapi()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        strapiPostPage(range(PAGE_SIZE, 'a').map((slug) => ({ slug })))
      )
      .mockResolvedValueOnce(strapiPostPage([{ slug: 'tail-article' }]))
    vi.stubGlobal('fetch', fetchMock)

    const slugs = await getBlogArticleSlugs()

    expect(slugs).toHaveLength(PAGE_SIZE + 1)
    expect(slugs.at(-1)).toBe('tail-article')
    expect(
      fetchMock.mock.calls.map(
        ([, init]) => JSON.parse((init as RequestInit).body as string).variables
      )
    ).toEqual([
      { type: 'Article', start: 0, limit: PAGE_SIZE },
      { type: 'Article', start: PAGE_SIZE, limit: PAGE_SIZE },
    ])
  })

  it('carries each episode show slug across pages', async () => {
    useStrapi()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        strapiPostPage(
          range(PAGE_SIZE, 'ep').map((slug) => ({
            slug,
            showSlug: 'logos-state',
          }))
        )
      )
      .mockResolvedValueOnce(
        strapiPostPage([{ slug: 'tail-episode', showSlug: 'hashing-it-out' }])
      )
    vi.stubGlobal('fetch', fetchMock)

    const paths = await getBlogPodcastPaths()

    expect(paths).toHaveLength(PAGE_SIZE + 1)
    expect(paths.at(-1)).toEqual({
      showSlug: 'hashing-it-out',
      slug: 'tail-episode',
    })
  })

  it('keeps walking when a full page carries an unusable row', async () => {
    useStrapi()
    const withGap = [
      ...range(PAGE_SIZE - 1, 'a').map((slug) => ({ slug })),
      { slug: '' },
    ]
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(strapiPostPage(withGap))
      .mockResolvedValueOnce(strapiPostPage([{ slug: 'tail-article' }]))
    vi.stubGlobal('fetch', fetchMock)

    const slugs = await getBlogArticleSlugs()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(slugs).toHaveLength(PAGE_SIZE)
    expect(slugs).toContain('tail-article')
    expect(slugs).not.toContain('')
  })
})

const strapiArticle = (slug: string, publishDate: string) =>
  jsonResponse({
    data: {
      posts: {
        data: [
          {
            id: slug,
            attributes: {
              slug,
              title: slug.toUpperCase(),
              publish_date: publishDate,
            },
          },
        ],
      },
    },
  })

describe('getAllBlogArticles', () => {
  it('returns every article detail in slug order', async () => {
    useStrapi()
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const { query, variables } = JSON.parse(init.body as string) as {
        query: string
        variables: { slug?: string }
      }
      if (query.includes('PostSlugs')) {
        return strapiPostPage([{ slug: 'first' }, { slug: 'second' }])
      }
      return strapiArticle(variables.slug!, '2026-07-01T00:00:00.000Z')
    })
    vi.stubGlobal('fetch', fetchMock)

    const articles = await getAllBlogArticles()

    expect(articles.map((article) => article.title)).toEqual([
      'FIRST',
      'SECOND',
    ])
  })
})

describe('isPublishedPost', () => {
  it('keeps posts that are live and dated', () => {
    expect(isPublishedPost({ isDraft: false, publishedAt: '2026-07-01' })).toBe(
      true
    )
    expect(isPublishedPost({ isDraft: true, publishedAt: '2026-07-01' })).toBe(
      false
    )
    expect(isPublishedPost({ isDraft: false, publishedAt: null })).toBe(false)
  })
})
