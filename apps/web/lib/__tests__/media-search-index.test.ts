import { describe, expect, it } from 'vitest'

import type { BlogArticleDetail, BlogPodcastDetail } from '@/lib/blog-content'
import type { MediaImageManifest } from '@/lib/media-images'
import {
  MEDIA_SEARCH_BODY_LIMIT,
  MEDIA_SEARCH_DESCRIPTION_LIMIT,
  buildMediaSearchDocuments,
} from '@/lib/media-search-index'

const CMS = 'https://cms-press.logos.co/uploads'

const manifest: MediaImageManifest = {
  [`${CMS}/cover.png`]: {
    width: 1200,
    height: 630,
    variants: [{ width: 750, file: 'cover-1a2b3c4d-750.webp' }],
  },
}

const article = (overrides: Partial<BlogArticleDetail> = {}) =>
  ({
    type: 'article',
    id: '135',
    slug: 'june-2026',
    title: 'State of the Logos Network: June 2026',
    subtitle: 'Monthly roundup',
    summary: 'Roundup summary',
    publishedAt: '2026-07-01T00:00:00.000Z',
    tags: [{ id: '1', name: 'Community' }],
    authors: [{ id: '1', name: 'Logos' }],
    coverImage: { url: `${CMS}/cover.png`, alt: '', width: 0, height: 0 },
    bodyHtml: '<h2 id="berlin">Berlin</h2><p>Circles met in <b>Berlin</b>.</p>',
    ...overrides,
  }) as BlogArticleDetail

const podcast = (overrides: Partial<BlogPodcastDetail> = {}) =>
  ({
    type: 'podcast',
    id: '63',
    slug: 'federico-ast-kleros',
    showSlug: 'logos-state',
    title: 'Federico Ast, Kleros',
    summary: '',
    description: '<p>Arbitration &amp; courts</p>',
    publishedAt: '2024-09-18T00:00:00.000Z',
    tags: [],
    authors: [{ id: '2', name: 'Jarrad Hope' }],
    coverImage: {
      url: `${CMS}/episode.png`,
      alt: 'Episode art',
      width: 0,
      height: 0,
    },
    content: [
      {
        type: 'text',
        order: 1,
        tagName: 'p',
        html: '<p>00:00 Introductions</p>',
        text: '00:00 Introductions',
        labels: [],
      },
    ],
    ...overrides,
  }) as BlogPodcastDetail

describe('buildMediaSearchDocuments', () => {
  it('indexes an article with its text, tags and resized cover', () => {
    expect(buildMediaSearchDocuments([article()], manifest)).toEqual([
      {
        id: 'article:june-2026',
        type: 'article',
        slug: 'june-2026',
        title: 'State of the Logos Network: June 2026',
        description: 'Monthly roundup',
        body: 'Berlin Circles met in Berlin .',
        tags: ['Community'],
        authors: ['Logos'],
        publishedAt: '2026-07-01T00:00:00.000Z',
        href: '/media/article/june-2026',
        image: {
          url: '/media-images/cover-1a2b3c4d-750.webp',
          alt: 'State of the Logos Network: June 2026',
        },
      },
    ])
  })

  it('indexes an episode under its own show with its show notes', () => {
    const [document] = buildMediaSearchDocuments([podcast()], manifest)

    expect(document).toMatchObject({
      id: 'podcast:federico-ast-kleros',
      type: 'podcast',
      description: 'Arbitration & courts',
      body: '00:00 Introductions',
      href: '/media/podcasts/logos-state/federico-ast-kleros',
      image: { url: `${CMS}/episode.png`, alt: 'Episode art' },
    })
  })

  it('shortens long show notes to an excerpt for the results list', () => {
    const notes = `<p>${'Jarrad talks to Federico about courts. '.repeat(20)}</p>`
    const [document] = buildMediaSearchDocuments(
      [podcast({ description: notes })],
      manifest
    )

    expect(document?.description.length).toBeLessThanOrEqual(
      MEDIA_SEARCH_DESCRIPTION_LIMIT + 1
    )
    expect(document?.description).toMatch(/^Jarrad talks .*courts\.…$/)
  })

  it('falls back to the summary when an article has no subtitle', () => {
    const [document] = buildMediaSearchDocuments(
      [article({ subtitle: undefined })],
      manifest
    )

    expect(document?.description).toBe('Roundup summary')
  })

  it('leaves out drafts and undated posts', () => {
    const documents = buildMediaSearchDocuments(
      [article({ isDraft: true }), article({ slug: 'x', publishedAt: null })],
      manifest
    )

    expect(documents).toEqual([])
  })

  it('trims long bodies so the index stays small', () => {
    const [document] = buildMediaSearchDocuments(
      [
        article({
          bodyHtml: `<p>${'word '.repeat(MEDIA_SEARCH_BODY_LIMIT)}</p>`,
        }),
      ],
      manifest
    )

    expect(document?.body.length).toBeLessThanOrEqual(MEDIA_SEARCH_BODY_LIMIT)
  })
})
