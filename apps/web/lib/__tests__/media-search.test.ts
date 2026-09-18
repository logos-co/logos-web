import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createMediaSearch,
  loadMediaSearch,
  type MediaSearchDocument,
} from '@/lib/media-search'

const doc = (
  slug: string,
  overrides: Partial<MediaSearchDocument> = {}
): MediaSearchDocument => ({
  id: `article:${slug}`,
  type: 'article',
  slug,
  title: slug,
  description: '',
  body: '',
  tags: [],
  authors: [],
  publishedAt: '2026-01-01T00:00:00.000Z',
  href: `/media/article/${slug}`,
  image: null,
  ...overrides,
})

const documents: MediaSearchDocument[] = [
  doc('decentralise-log', {
    title: 'Decentralise the log, not the server',
    body: 'Blockchain consensus explained for builders.',
    tags: ['Blockchain', 'Logos_stack'],
    publishedAt: '2026-03-01T00:00:00.000Z',
  }),
  doc('testnet-v02-live', {
    title: 'Logos testnet v0.2 is live',
    description: 'Run a node today.',
    tags: ['Testnet'],
    publishedAt: '2026-06-01T00:00:00.000Z',
  }),
  doc('june-2026', {
    title: 'State of the Logos Network: June 2026',
    body: 'Circles met in Berlin. The testnet grew.',
    tags: ['Community'],
    publishedAt: '2026-07-01T00:00:00.000Z',
  }),
  doc('federico-ast-kleros', {
    id: 'podcast:federico-ast-kleros',
    type: 'podcast',
    title: 'Federico Ast, Kleros: Decentralised Arbitration System',
    tags: ['Blockchain'],
    authors: ['Jarrad Hope'],
    href: '/media/podcasts/logos-state/federico-ast-kleros',
    publishedAt: '2024-09-18T00:00:00.000Z',
  }),
]

const search = createMediaSearch(documents)
const request = (query: string, overrides = {}) => ({
  query,
  tags: [],
  types: ['article', 'podcast'] as const,
  ...overrides,
})
const slugs = (query: string, overrides = {}) =>
  search.search(request(query, overrides)).posts.map((post) => post.slug)

describe('createMediaSearch', () => {
  it('matches the start of a word', () => {
    expect(slugs('decentrali')).toEqual(
      expect.arrayContaining(['decentralise-log', 'federico-ast-kleros'])
    )
  })

  it('needs every word when some post has them all', () => {
    expect(slugs('logos testnet')).toEqual(['testnet-v02-live', 'june-2026'])
  })

  it('falls back to any word when no post has them all', () => {
    expect(slugs('kleros berlin').sort()).toEqual([
      'federico-ast-kleros',
      'june-2026',
    ])
  })

  it('puts posts with the exact phrase first', () => {
    const phrase = createMediaSearch([
      doc('scattered', {
        title: 'State of play',
        body: 'The network grew. Every state voted. State of the network, state of play.',
        publishedAt: '2026-06-01T00:00:00.000Z',
      }),
      doc('exact', {
        title: 'Why build',
        body: 'A network state is a new kind of community.',
        publishedAt: '2025-01-01T00:00:00.000Z',
      }),
    ])

    expect(
      phrase.search(request('network state')).posts.map((post) => post.slug)
    ).toEqual(['exact', 'scattered'])
  })

  it('forgives a typo in a longer word', () => {
    expect(slugs('blokchain')).toContain('decentralise-log')
  })

  it('ranks a title match above a body match', () => {
    expect(slugs('testnet')[0]).toBe('testnet-v02-live')
  })

  it('finds posts by author', () => {
    expect(slugs('jarrad')).toEqual(['federico-ast-kleros'])
  })

  it('filters by content type', () => {
    expect(slugs('decentralised', { types: ['podcast'] })).toEqual([
      'federico-ast-kleros',
    ])
  })

  it('keeps posts carrying any selected topic', () => {
    expect(slugs('', { tags: ['blockchain', 'Testnet'] })).toEqual([
      'testnet-v02-live',
      'decentralise-log',
      'federico-ast-kleros',
    ])
  })

  it('lists everything newest first for an empty query', () => {
    expect(slugs('   ')).toEqual([
      'june-2026',
      'testnet-v02-live',
      'decentralise-log',
      'federico-ast-kleros',
    ])
  })

  it('pages through results', () => {
    const firstPage = search.search(request('', { limit: 3 }))
    const secondPage = search.search(request('', { skip: 3, limit: 3 }))

    expect(firstPage).toMatchObject({ total: 4, hasMore: true })
    expect(firstPage.posts).toHaveLength(3)
    expect(secondPage).toMatchObject({ total: 4, hasMore: false })
    expect(secondPage.posts.map((post) => post.slug)).toEqual([
      'federico-ast-kleros',
    ])
  })

  it('returns the fields the results list renders', () => {
    const [post] = search.search(request('kleros')).posts

    expect(post).toEqual({
      type: 'podcast',
      slug: 'federico-ast-kleros',
      title: 'Federico Ast, Kleros: Decentralised Arbitration System',
      description: '',
      publishedAt: '2024-09-18T00:00:00.000Z',
      href: '/media/podcasts/logos-state/federico-ast-kleros',
      image: null,
    })
  })

  it('merges topics that differ only in case', () => {
    const mixed = createMediaSearch([
      doc('a', { tags: ['Blockchain'] }),
      doc('b', { tags: ['blockchain'] }),
      doc('c', { tags: ['Blockchain', 'community'] }),
    ])

    expect(mixed.topics).toEqual(['Blockchain', 'community'])
  })

  it('offers topics by how many posts use them', () => {
    expect(search.topics).toEqual([
      'Blockchain',
      'Community',
      'Logos_stack',
      'Testnet',
    ])
  })
})

describe('loadMediaSearch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the index once per URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ documents }), { status: 200 })
      )
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([
      loadMediaSearch('/media-search-index.json?test=1'),
      loadMediaSearch('/media-search-index.json?test=1'),
    ])

    expect(first).toBe(second)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(first.search(request('kleros')).total).toBe(1)
  })

  it('rejects and retries later when the index cannot be loaded', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ documents }), { status: 200 })
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loadMediaSearch('/media-search-index.json?test=2')
    ).rejects.toThrow('404')
    await expect(
      loadMediaSearch('/media-search-index.json?test=2')
    ).resolves.toBeDefined()
  })
})
