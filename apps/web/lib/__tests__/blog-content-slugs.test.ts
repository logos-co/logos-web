import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getBlogArticleSlugs, getBlogPodcastPaths } from '@/lib/blog-content'

const { envStub } = vi.hoisted(() => ({
  envStub: {
    CI: false,
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

const legacyArticlePage = (slugs: string[]) =>
  jsonResponse({
    data: { posts: slugs.map((slug) => ({ type: 'article', data: { slug } })) },
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

describe('getBlogArticleSlugs on the legacy search API', () => {
  it('reads every page instead of stopping at the first response cap', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(legacyArticlePage(range(PAGE_SIZE, 'a')))
      .mockResolvedValueOnce(legacyArticlePage(range(PAGE_SIZE, 'b')))
      .mockResolvedValueOnce(legacyArticlePage(range(37, 'c')))
    vi.stubGlobal('fetch', fetchMock)

    const slugs = await getBlogArticleSlugs()

    expect(slugs).toHaveLength(PAGE_SIZE * 2 + 37)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(
      fetchMock.mock.calls.map(([url]) =>
        new URL(url as string).searchParams.get('skip')
      )
    ).toEqual(['0', '100', '200'])
  })

  it('stops after a single short page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(legacyArticlePage(['only-article']))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getBlogArticleSlugs()).resolves.toEqual(['only-article'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps walking when a full page carries an unusable row', async () => {
    const withGap = [...range(PAGE_SIZE - 1, 'a'), '']
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(legacyArticlePage(withGap))
      .mockResolvedValueOnce(legacyArticlePage(['tail-article']))
    vi.stubGlobal('fetch', fetchMock)

    const slugs = await getBlogArticleSlugs()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(slugs).toHaveLength(PAGE_SIZE)
    expect(slugs).toContain('tail-article')
    expect(slugs).not.toContain('')
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
})
