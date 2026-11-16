import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PressSnapshot } from '@/lib/press-snapshot'

const { envStub, fallback } = vi.hoisted(() => ({
  envStub: {
    ALLOW_CONTENT_FETCH_FAILURE: false,
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
  envStub.STRAPI_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('blog CMS outage', () => {
  it('fails the build by default', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(gatewayTimeout))
    const { getBlogArticleSlugs } = await loadBlogContent()

    await expect(getBlogArticleSlugs()).rejects.toThrow(/status=504/)
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
    // One failure is enough: the rest skips the dead CMS.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('names the post when the snapshot does not have it', async () => {
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(gatewayTimeout))
    const { getBlogArticleDetail } = await loadBlogContent()

    await expect(getBlogArticleDetail('new-article')).rejects.toThrow(
      /Article new-article is missing from the committed press snapshot/
    )
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

describe('allowContentFetchFailure', () => {
  it('rethrows unless ALLOW_CONTENT_FETCH_FAILURE is set', async () => {
    const { allowContentFetchFailure } =
      await import('@/lib/content-fetch-fallback')
    const error = new Error('down')

    expect(() => allowContentFetchFailure('Source', error)).toThrow(error)
    envStub.ALLOW_CONTENT_FETCH_FAILURE = true
    expect(() => allowContentFetchFailure('Source', error)).not.toThrow()
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
