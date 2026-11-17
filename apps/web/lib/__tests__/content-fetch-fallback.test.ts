import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PressSnapshot } from '@/lib/press-snapshot'

const { envStub, fallback } = vi.hoisted(() => ({
  envStub: {
    ALLOW_CONTENT_FETCH_FAILURE: false,
    ALLOW_ACTIVE_CIRCLES_FETCH_FAILURE: false,
    NEXT_PUBLIC_API_MODE: undefined as string | undefined,
    PRESS_CONTENT_SNAPSHOT: undefined as string | undefined,
    STRAPI_API_KEY: 'test-key' as string | undefined,
  },
  fallback: {
    version: 1,
    articles: [{ slug: 'kept-article', title: 'Kept article' }],
    podcasts: [{ showSlug: 'logos-state', slug: 'kept-episode' }],
  } as unknown as PressSnapshot,
}))

vi.mock('@/lib/env', () => ({ env: envStub }))
vi.mock('@/lib/press-snapshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/press-snapshot')>()),
  getFallbackPressSnapshot: async () => fallback,
}))
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const graphqlError = {
  ok: true,
  status: 200,
  text: async () => JSON.stringify({ errors: [{ message: 'bad field' }] }),
}

const gatewayTimeout = {
  ok: false,
  status: 504,
  text: async () => '<html>504 Gateway Time-out</html>',
}

// blog-content remembers a dead CMS for the rest of the process.
const loadBlogContent = async () => {
  vi.resetModules()
  return import('@/lib/blog-content')
}

beforeEach(() => {
  envStub.ALLOW_CONTENT_FETCH_FAILURE = false
  envStub.ALLOW_ACTIVE_CIRCLES_FETCH_FAILURE = false
  envStub.STRAPI_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('blog CMS outage', () => {
  it('fails the build by default', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(gatewayTimeout))
    const { getBlogArticleSlugs, isCmsUnavailable } = await loadBlogContent()

    await expect(getBlogArticleSlugs()).rejects.toThrow(/status=504/)
    expect(isCmsUnavailable()).toBe(false)
  })

  it('reads the committed snapshot with ALLOW_CONTENT_FETCH_FAILURE', async () => {
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    const fetchMock = vi.fn().mockResolvedValue(gatewayTimeout)
    vi.stubGlobal('fetch', fetchMock)
    const content = await loadBlogContent()

    await expect(content.getBlogArticleSlugs()).resolves.toEqual([
      'kept-article',
    ])
    await expect(content.getBlogPodcastPaths()).resolves.toEqual([
      { showSlug: 'logos-state', slug: 'kept-episode' },
    ])
    await expect(content.getBlogArticleDetail('kept-article')).resolves.toBe(
      fallback.articles[0]
    )
    await expect(content.isUsingPressSnapshot()).resolves.toBe(true)
    // generate-media-assets reads this to skip image downloads.
    expect(content.isCmsUnavailable()).toBe(true)
    // One failure is enough: the rest skips the dead CMS.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('names the post when the snapshot does not have it', async () => {
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(gatewayTimeout))
    const { getBlogArticleDetail, PressPostUnavailableError } =
      await loadBlogContent()

    const detail = getBlogArticleDetail('new-article')
    await expect(detail).rejects.toThrow(
      /Article new-article is missing from the committed press snapshot/
    )
    await expect(detail).rejects.toBeInstanceOf(PressPostUnavailableError)
  })

  it('drops a live post the snapshot lacks from the listings', async () => {
    // The CMS listed the posts, then went down before the new one was read.
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: {
                posts: {
                  data: [
                    { attributes: { slug: 'new-article' } },
                    { attributes: { slug: 'kept-article' } },
                  ],
                },
              },
            }),
        })
        .mockResolvedValue(gatewayTimeout)
    )
    const { getAllBlogArticles } = await loadBlogContent()

    await expect(getAllBlogArticles()).resolves.toEqual([fallback.articles[0]])
  })

  it('falls back for one read only when the CMS answers with an error', async () => {
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    const fetchMock = vi.fn().mockResolvedValue(graphqlError)
    vi.stubGlobal('fetch', fetchMock)
    const content = await loadBlogContent()

    await expect(content.getBlogArticleSlugs()).resolves.toEqual([
      'kept-article',
    ])
    await expect(content.getBlogPodcastPaths()).resolves.toHaveLength(1)
    // The CMS is up, so each read still tries it and images still download.
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(content.isCmsUnavailable()).toBe(false)
    await expect(content.isUsingPressSnapshot()).resolves.toBe(true)
  })

  it('also covers a build without the Strapi key', async () => {
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    envStub.STRAPI_API_KEY = undefined
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { getBlogArticleSlugs } = await loadBlogContent()

    await expect(getBlogArticleSlugs()).resolves.toEqual(['kept-article'])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('active circles outage', () => {
  it('fails instead of writing a half-fetched snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(gatewayTimeout))
    vi.resetModules()
    const { buildActiveCirclesSnapshot } =
      await import('@/lib/active-circles-source')

    await expect(buildActiveCirclesSnapshot(new Date())).rejects.toThrow(
      /GraphQL request failed: 504/
    )
  })
})

describe('active circles partial answer', () => {
  it('fails when the API returns errors next to data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {}, errors: [{ message: 'timeout' }] }),
      })
    )
    vi.resetModules()
    const { buildActiveCirclesSnapshot } =
      await import('@/lib/active-circles-source')

    await expect(buildActiveCirclesSnapshot(new Date())).rejects.toThrow(
      /returned errors.*timeout/
    )
  })
})

describe('the committed press snapshot', () => {
  it('is readable by a production build', async () => {
    const { FALLBACK_PRESS_SNAPSHOT_PATH, readPressSnapshot } =
      await import('@/lib/press-snapshot')

    const snapshot = await readPressSnapshot(FALLBACK_PRESS_SNAPSHOT_PATH)

    expect(snapshot.version).toBe(1)
    expect(snapshot.articles.length).toBeGreaterThan(0)
    expect(snapshot.podcasts.length).toBeGreaterThan(0)
    const posts = [...snapshot.articles, ...snapshot.podcasts]
    expect(posts.filter((post) => post.isDraft)).toEqual([])
    expect(snapshot.articles.filter((article) => article.discussion)).toEqual(
      []
    )
  })
})

describe('allowContentFetchFailure', () => {
  it('rethrows unless ALLOW_CONTENT_FETCH_FAILURE is set', async () => {
    const { allowContentFetchFailure } =
      await import('@/lib/content-fetch-fallback')
    const error = new Error('down')

    expect(() => allowContentFetchFailure('Source', error)).toThrow(error)
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    expect(() => allowContentFetchFailure('Source', error)).not.toThrow()
  })

  it('allows the circles snapshot independently of the blog CMS', async () => {
    const { allowContentFetchFailure } =
      await import('@/lib/content-fetch-fallback')
    const error = new Error('upstream 504')
    const onCirclesFailure = () =>
      allowContentFetchFailure(
        'Active circles',
        error,
        'ALLOW_ACTIVE_CIRCLES_FETCH_FAILURE'
      )

    expect(onCirclesFailure).toThrow(error)
    envStub.ALLOW_ACTIVE_CIRCLES_FETCH_FAILURE = true
    expect(onCirclesFailure).not.toThrow()
    expect(() => allowContentFetchFailure('Blog CMS', error)).toThrow(error)
  })
})

describe('toFallbackPressSnapshot', () => {
  it('keeps published posts without their forum replies', async () => {
    const { toFallbackPressSnapshot } = await import('@/lib/press-snapshot')
    const published = { slug: 'published', isDraft: false, discussion: {} }
    const draft = { slug: 'draft', isDraft: true }

    const snapshot = toFallbackPressSnapshot(
      [published, draft] as never,
      [{ slug: 'episode', isDraft: true }] as never
    )

    expect(snapshot).toEqual({
      version: 1,
      articles: [{ slug: 'published', isDraft: false }],
      podcasts: [],
    })
  })
})
