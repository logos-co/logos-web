import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BLOG_SEARCH_PAGE_SIZE,
  buildBlogSearchApiUrl,
  searchBlog,
} from '@/lib/blog-search-api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildBlogSearchApiUrl', () => {
  it('matches the legacy Logos blog search API contract', () => {
    const url = new URL(
      buildBlogSearchApiUrl({
        query: 'parallel society',
        tags: ['Community', 'Logos_stack'],
        types: ['article', 'podcast'],
      })
    )

    expect(url.origin + url.pathname).toBe(
      'https://lpe-seven.vercel.app/api/search'
    )
    expect(url.searchParams.get('skip')).toBe('0')
    expect(url.searchParams.get('limit')).toBe(String(BLOG_SEARCH_PAGE_SIZE))
    expect(url.searchParams.get('q')).toBe('parallel society')
    expect(url.searchParams.get('tags')).toBe('Community,Logos_stack')
    expect(url.searchParams.get('type')).toBe('article,podcast')
  })

  it('uses the legacy blank-query value and pagination parameters', () => {
    const url = new URL(
      buildBlogSearchApiUrl({
        query: '',
        tags: [],
        types: ['article'],
        skip: 30,
        limit: 15,
      })
    )

    expect(url.searchParams.get('q')).toBe(' ')
    expect(url.searchParams.get('skip')).toBe('30')
    expect(url.searchParams.get('limit')).toBe('15')
    expect(url.searchParams.get('tags')).toBe('')
    expect(url.searchParams.get('type')).toBe('article')
  })

  it('maps legacy article and podcast results like the original search page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          total: 2,
          hasMore: false,
          posts: [
            {
              type: 'article',
              data: {
                title: 'An article',
                slug: 'an-article',
                subtitle: 'Article subtitle',
                publishedAt: '2026-01-01',
                modifiedAt: '2026-01-02',
              },
            },
            {
              type: 'podcast',
              data: {
                title: 'A podcast',
                slug: 'a-podcast',
                summary: '<p>Legacy podcast cards do not show this.</p>',
                publishedAt: '2024-09-18',
              },
            },
          ],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchBlog({
      query: 'parallel',
      tags: [],
      types: ['article', 'podcast'],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://lpe-seven.vercel.app/api/search?skip=0&limit=15&q=parallel&tags=&type=article%2Cpodcast',
      {
        headers: { Accept: 'application/json' },
        signal: undefined,
      }
    )
    expect(result).toEqual({
      total: 2,
      hasMore: false,
      posts: [
        {
          type: 'article',
          title: 'An article',
          description: 'Article subtitle',
          slug: 'an-article',
          publishedAt: '2026-01-02',
          href: '/media/article/an-article',
          image: null,
        },
        {
          type: 'podcast',
          title: 'A podcast',
          description: '',
          slug: 'a-podcast',
          publishedAt: '2024-09-18',
          href: '/media/podcasts/logos-state/a-podcast',
          image: null,
        },
      ],
    })
  })
})
