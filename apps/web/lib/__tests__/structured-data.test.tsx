import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { JsonLd } from '@/components/seo/json-ld'
import siteConfig from '@/constants/site-config'
import {
  createArticleJsonLd,
  createBreadcrumbListJsonLd,
  createOrganizationJsonLd,
  createPodcastEpisodeJsonLd,
  createWebSiteJsonLd,
} from '@/lib/structured-data'

// Derived, not hardcoded: siteConfig.url comes from NEXT_PUBLIC_SITE_URL, which
// is set in some environments. These cases assert URL shape, not the hostname.
const BASE_URL = siteConfig.url.replace(/\/+$/, '')

describe('structured data', () => {
  it('builds the canonical Logos organisation entity', () => {
    expect(createOrganizationJsonLd()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Logos',
      url: BASE_URL,
      logo: `${BASE_URL}/apple-touch-icon.png`,
    })
  })

  it('lists every configured social profile as sameAs', () => {
    // "Logos" collides with the common noun for logo design, so these are the
    // signals that tell Google which entity the site belongs to. Discord was
    // configured in settings.json but never reached the graph.
    const { sameAs } = createOrganizationJsonLd() as { sameAs: string[] }

    expect(sameAs).toEqual(
      expect.arrayContaining([
        expect.stringContaining('twitter.com'),
        expect.stringContaining('youtube.com'),
        expect.stringContaining('github.com'),
        expect.stringContaining('discord'),
      ])
    )
  })

  it('builds a WebSite entity published by the organisation', () => {
    expect(createWebSiteJsonLd()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Logos',
      inLanguage: 'en',
      publisher: { '@id': `${BASE_URL}/#organization` },
    })
  })

  it('links the WebSite publisher to the Organization node id', () => {
    const organisation = createOrganizationJsonLd() as { '@id': string }
    const website = createWebSiteJsonLd() as {
      publisher: { '@id': string }
    }

    expect(website.publisher['@id']).toBe(organisation['@id'])
  })

  it('builds ordered canonical breadcrumb URLs', () => {
    expect(
      createBreadcrumbListJsonLd(
        [
          { name: 'Logos', path: '/' },
          { name: 'Technology Stack', path: '/technology-stack' },
          { name: 'Storage', path: '/technology-stack/storage' },
        ],
        'en'
      )
    ).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Logos',
          item: `${BASE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Technology Stack',
          item: `${BASE_URL}/technology-stack`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Storage',
          item: `${BASE_URL}/technology-stack/storage`,
        },
      ],
    })
  })

  it('builds a media article published by the organisation node', () => {
    const organisation = createOrganizationJsonLd() as { '@id': string }
    const article = createArticleJsonLd({
      path: '/media/article/june-2026',
      headline: 'State of the Logos Network: June 2026',
      description: 'Monthly roundup',
      image: 'https://cms-press.logos.co/uploads/cover.png',
      datePublished: '2026-07-01T00:00:00.000Z',
      dateModified: null,
      authors: ['Logos'],
    })

    expect(article).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'State of the Logos Network: June 2026',
      description: 'Monthly roundup',
      url: `${BASE_URL}/media/article/june-2026`,
      image: 'https://cms-press.logos.co/uploads/cover.png',
      datePublished: '2026-07-01T00:00:00.000Z',
      dateModified: '2026-07-01T00:00:00.000Z',
      author: [{ '@type': 'Person', name: 'Logos' }],
      publisher: {
        '@type': 'Organization',
        '@id': organisation['@id'],
        name: 'Logos',
        url: BASE_URL,
        logo: `${BASE_URL}/apple-touch-icon.png`,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/media/article/june-2026`,
      },
    })
  })

  it('writes date-only CMS values as full timestamps', () => {
    // Rich Results flags bare dates as invalid datetimes without a timezone.
    const article = createArticleJsonLd({
      path: '/media/article/anonymous-block-proposers',
      headline: 'Anonymous Block Proposers',
      description: '',
      datePublished: '2026-03-24',
      dateModified: '2026-03-25',
      authors: [],
    })
    const episode = createPodcastEpisodeJsonLd({
      path: '/media/podcasts/logos-state/episode',
      name: 'Episode',
      description: '',
      datePublished: '2024-09-18',
    })

    expect(article.datePublished).toBe('2026-03-24T00:00:00.000Z')
    expect(article.dateModified).toBe('2026-03-25T00:00:00.000Z')
    expect(episode.datePublished).toBe('2024-09-18T00:00:00.000Z')
  })

  it('drops dates the CMS stored in an unreadable format', () => {
    const article = createArticleJsonLd({
      path: '/media/article/broken',
      headline: 'Broken',
      description: '',
      datePublished: 'not a date',
      dateModified: null,
      authors: [],
    })

    expect(article.datePublished).toBeUndefined()
    expect(article.dateModified).toBeUndefined()
  })

  it('builds a podcast episode that belongs to its series', () => {
    expect(
      createPodcastEpisodeJsonLd({
        path: '/media/podcasts/logos-state/federico-ast-kleros',
        name: 'Federico Ast, Kleros',
        description: 'Decentralised arbitration',
        image: null,
        datePublished: '2024-09-18T00:00:00.000Z',
        episodeNumber: 63,
        series: { name: 'Logos Podcast', path: '/media#podcasts' },
      })
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'PodcastEpisode',
      name: 'Federico Ast, Kleros',
      description: 'Decentralised arbitration',
      url: `${BASE_URL}/media/podcasts/logos-state/federico-ast-kleros`,
      image: undefined,
      datePublished: '2024-09-18T00:00:00.000Z',
      episodeNumber: 63,
      partOfSeries: {
        '@type': 'PodcastSeries',
        name: 'Logos Podcast',
        url: `${BASE_URL}/media#podcasts`,
      },
    })
  })

  it('leaves the series out of an episode that has no show', () => {
    const episode = createPodcastEpisodeJsonLd({
      path: '/media/podcasts/logos-state/episode',
      name: 'Episode',
      description: '',
      datePublished: null,
    })

    expect(episode.partOfSeries).toBeUndefined()
    expect(JSON.stringify(episode)).not.toContain('datePublished')
  })

  it('escapes markup that could terminate the JSON-LD script', () => {
    const html = renderToStaticMarkup(
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Thing',
          name: '</script><script>alert(1)</script>',
        }}
      />
    )

    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).toContain('\\u003c/script>')
  })
})
