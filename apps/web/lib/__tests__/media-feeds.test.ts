import { describe, expect, it } from 'vitest'

import type { BlogArticleDetail, BlogPodcastDetail } from '@/lib/blog-content'
import {
  buildAtomDocument,
  buildRssDocument,
  isFeedXml,
} from '@/lib/media-feeds'

const article = (overrides: Partial<BlogArticleDetail> = {}) =>
  ({
    type: 'article',
    id: '135',
    slug: 'june-2026',
    title: 'State of the Logos Network: June 2026',
    summary: 'Roundup & news',
    publishedAt: '2026-07-01T00:00:00.000Z',
    modifiedAt: null,
    ...overrides,
  }) as BlogArticleDetail

const podcast = (overrides: Partial<BlogPodcastDetail> = {}) =>
  ({
    type: 'podcast',
    id: '63',
    slug: 'federico-ast-kleros',
    showSlug: 'logos-state',
    title: 'Federico Ast, Kleros',
    description: 'Arbitration',
    publishedAt: '2024-09-18T00:00:00.000Z',
    modifiedAt: null,
    channels: [
      {
        name: 'simplecast',
        url: '',
        data: { audioFileUrl: 'https://cdn.example/ep.mp3' },
      },
    ],
    ...overrides,
  }) as BlogPodcastDetail

const rss = (posts: Array<BlogArticleDetail | BlogPodcastDetail>) =>
  buildRssDocument({ title: 'Logos Media', description: 'Articles', posts })

describe('buildRssDocument', () => {
  it('keeps the legacy blog guid so subscribers do not see repeats', () => {
    // blog.logos.co published the CMS post id as a non-permalink guid; readers
    // dedupe on it, so a new guid would resurface every post after the 301.
    expect(rss([article()])).toContain('<guid isPermaLink="false">135</guid>')
  })

  it('links each item to its logos.co media page', () => {
    const xml = rss([article(), podcast()])

    expect(xml).toContain(
      '<link>https://logos.co/media/article/june-2026</link>'
    )
    expect(xml).toContain(
      '<link>https://logos.co/media/podcasts/logos-state/federico-ast-kleros</link>'
    )
  })

  it('falls back to the page URL when a post has no id', () => {
    expect(rss([article({ id: '' })])).toContain(
      '<guid isPermaLink="true">https://logos.co/media/article/june-2026</guid>'
    )
  })

  it('attaches the episode audio as an enclosure', () => {
    expect(rss([podcast()])).toContain(
      '<enclosure url="https://cdn.example/ep.mp3" type="audio/mpeg" />'
    )
  })

  it('escapes text and dates each item', () => {
    const xml = rss([article()])

    expect(xml).toContain('<description>Roundup &amp; news</description>')
    expect(xml).toContain('<pubDate>Wed, 01 Jul 2026 00:00:00 GMT</pubDate>')
    expect(isFeedXml(xml)).toBe(true)
  })
})

describe('buildAtomDocument', () => {
  it('writes date-only CMS values as full Atom timestamps', () => {
    const xml = buildAtomDocument([
      article({ modifiedAt: '2026-09-15', publishedAt: '2026-09-14' }),
    ])

    expect(xml).toContain('<updated>2026-09-15T00:00:00.000Z</updated>')
    expect(xml).not.toContain('<updated>2026-09-15</updated>')
  })

  it('uses the newest post as the feed update time', () => {
    const xml = buildAtomDocument([
      article({ modifiedAt: '2026-07-03T00:00:00.000Z' }),
      podcast(),
    ])

    expect(xml).toMatch(
      /^<\?xml[^>]*\?><feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"><id>https:\/\/logos\.co\/media<\/id><title>Logos Media<\/title><link href="https:\/\/logos\.co\/media"\/><updated>2026-07-03T00:00:00\.000Z<\/updated>/
    )
    expect(xml).toContain(
      '<entry><id>https://logos.co/media/article/june-2026</id>'
    )
  })
})

describe('isFeedXml', () => {
  it('accepts an RSS document behind an XML declaration', () => {
    const body =
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"></rss>'

    expect(isFeedXml(body)).toBe(true)
  })

  it('accepts an Atom document that opens with its root element', () => {
    const body = '<feed xmlns="http://www.w3.org/2005/Atom"></feed>'

    expect(isFeedXml(body)).toBe(true)
  })

  it('accepts a document behind leading whitespace or a byte order mark', () => {
    expect(isFeedXml('\n  <?xml version="1.0"?><rss></rss>')).toBe(true)
    expect(isFeedXml('\uFEFF<?xml version="1.0"?><rss></rss>')).toBe(true)
  })

  it('rejects the legacy blog SPA shell served at a feed URL', () => {
    const body =
      '<!DOCTYPE html><html lang="en"><head><title>The Logos Blog</title></head></html>'

    expect(isFeedXml(body)).toBe(false)
  })

  it('rejects an element that merely starts like a feed root', () => {
    expect(isFeedXml('<rssfeedwidget></rssfeedwidget>')).toBe(false)
    expect(isFeedXml('<feedback></feedback>')).toBe(false)
  })

  it('rejects an empty response', () => {
    expect(isFeedXml('')).toBe(false)
  })
})
