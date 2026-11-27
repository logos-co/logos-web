import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAllBlogArticles,
  getBlogArticleDetail,
  getBlogArticleSlugs,
  getBlogPodcastPaths,
  isPublishedPost,
} from '@/lib/blog-content'

const { envStub } = vi.hoisted(() => ({
  envStub: {
    NEXT_PUBLIC_API_MODE: undefined as string | undefined,
    SIMPLECAST_ACCESS_TOKEN: undefined as string | undefined,
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
  envStub.STRAPI_API_KEY = 'test-key'
}

beforeEach(() => {
  envStub.STRAPI_API_KEY = undefined
  envStub.NEXT_PUBLIC_API_MODE = undefined
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('without the Strapi key', () => {
  it('fails instead of reading the old blog', async () => {
    // blog.logos.co is being switched off, so there is no second source.
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getBlogArticleSlugs()).rejects.toThrow(
      /requires STRAPI_API_KEY/
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
    // The CMS address is fixed; only the key comes from the environment.
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://cms-press.logos.co/graphql',
      'https://cms-press.logos.co/graphql',
    ])
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

  it('skips articles whose slug is not a safe path segment', async () => {
    useStrapi()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          strapiPostPage([
            { slug: 'kept-article' },
            { slug: '../../escape' },
            { slug: 'two words' },
          ])
        )
    )

    await expect(getBlogArticleSlugs()).resolves.toEqual(['kept-article'])
  })

  it('skips episodes whose slug or show slug is not a safe path segment', async () => {
    useStrapi()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        strapiPostPage([
          { slug: 'kept-episode', showSlug: 'logos-state' },
          { slug: 'bad/episode', showSlug: 'logos-state' },
          { slug: 'episode', showSlug: '../../../tmp/feed' },
        ])
      )
    )

    await expect(getBlogPodcastPaths()).resolves.toEqual([
      { showSlug: 'logos-state', slug: 'kept-episode' },
    ])
  })
})

const strapiArticle = (
  slug: string,
  publishDate: string,
  content?: { body: string; summary: string }
) =>
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
              ...content,
            },
          },
        ],
      },
    },
  })

describe('a dropped CMS connection', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is retried instead of failing the build', async () => {
    // The CMS sits behind a proxy that now and then closes a connection.
    vi.useFakeTimers()
    useStrapi()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(strapiPostPage([{ slug: 'only-article' }]))
    vi.stubGlobal('fetch', fetchMock)

    const slugs = getBlogArticleSlugs()
    await vi.runAllTimersAsync()

    await expect(slugs).resolves.toEqual(['only-article'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('still fails the build when the CMS stays unreachable', async () => {
    vi.useFakeTimers()
    useStrapi()
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    vi.stubGlobal('fetch', fetchMock)

    const slugs = getBlogArticleSlugs()
    const assertion = expect(slugs).rejects.toThrow('fetch failed')
    await vi.runAllTimersAsync()

    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
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

describe('Strapi article HTML', () => {
  it('sanitises normal HTML after generating headings, references and video embeds', async () => {
    useStrapi()
    const fixture = strapiArticle('reviewed', '2026-07-01T00:00:00.000Z', {
      summary: '<p data-extra="ignored">A <strong>summary</strong></p>',
      body: [
        '<h2>Overview</h2>',
        '<h2 id="café">Café</h2><p><a href="#caf%C3%A9">Jump to Café</a> <a href="#title-anchor">Top</a></p>',
        '<p>References <sup class="footnote" data-id="source" data-index="1" data-content="&lt;em data-extra=&quot;ignored&quot;&gt;Source&lt;/em&gt;">1</sup></p>',
        '<figure class="media"><oembed url="https://www.youtube.com/watch?v=abcdefghijk&amp;t=1m30s"></oembed></figure>',
        '<figure class="image"><img src="/uploads/sample.png" style="aspect-ratio:4/3;"><figcaption>Example image</figcaption></figure>',
        '<object data="https://example.com/document"></object>',
        '<iframe src="https://www.youtube-nocookie.com/embed/abcdefghijk?start=30&amp;playsinline=1&amp;origin=ignored"></iframe>',
        '<iframe src="https://example.com/embed/abcdefghijk"></iframe>',
      ].join(''),
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture))

    const article = await getBlogArticleDetail('reviewed')

    expect(article.summaryHtml).toBe('<p>A <strong>summary</strong></p>')
    expect(article.toc.map((item) => item.href)).toEqual([
      '#overview',
      '#caf%C3%A9',
    ])
    expect(article.bodyHtml).toContain(
      '<h2 id="media-content-overview">Overview</h2>'
    )
    expect(article.bodyHtml).toContain('<h2 id="media-content-café">Café</h2>')
    expect(article.bodyHtml).toContain('href="#caf%C3%A9"')
    expect(article.bodyHtml).toContain('href="#title-anchor"')
    expect(article.bodyHtml).toContain('id="media-content-fntref-source"')
    expect(article.bodyHtml).toContain('href="#fnt-source"')
    expect(article.footnotes[0].valueHTML).toBe('<em>Source</em>')
    expect(article.bodyHtml).toContain(
      'src="https://www.youtube.com/embed/abcdefghijk?start=90"'
    )
    expect(article.bodyHtml).toContain('style="aspect-ratio:4/3;"')
    expect(article.bodyHtml).toContain('<figcaption>Example image</figcaption>')
    expect(article.bodyHtml).not.toContain('<object')
    expect(article.bodyHtml).toContain(
      'src="https://www.youtube-nocookie.com/embed/abcdefghijk?start=30&#x26;playsinline=1"'
    )
    expect(article.bodyHtml).not.toContain('<iframe></iframe>')
    expect(article.bodyHtml).not.toContain('https://example.com')
  })
})

describe('staging preview queries', () => {
  it('adds only the approved draft slugs to the live article archive', async () => {
    useStrapi()
    envStub.NEXT_PUBLIC_API_MODE = 'staging'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(strapiPostPage([{ slug: 'published' }]))
    )
    const slugs = await getBlogArticleSlugs()
    expect(slugs).toHaveLength(106)
    expect(slugs).toContain('published')
    expect(slugs).toContain('waku-roadmap')
    expect(slugs).toContain('2025-year-in-review')
    expect(slugs).toContain('codex-july-updates')
    expect(slugs).not.toContain('unrelated-draft')
  })

  it('reads approved drafts only on staging; other details remain live-only', async () => {
    useStrapi()
    const states: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const { variables } = JSON.parse(init.body as string)
        states.push(variables.publicationState)
        return strapiArticle(variables.slug, '2023-11-17')
      })
    )
    envStub.NEXT_PUBLIC_API_MODE = 'staging'
    await getBlogArticleDetail('waku-roadmap')
    await getBlogArticleDetail('unrelated-draft')
    envStub.NEXT_PUBLIC_API_MODE = 'production'
    await getBlogArticleDetail('waku-roadmap')
    expect(states).toEqual(['PREVIEW', 'LIVE', 'LIVE'])
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
