import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { JsonLd } from '@/components/seo/json-ld'
import siteConfig from '@/constants/site-config'
import {
  createBreadcrumbListJsonLd,
  createOrganizationJsonLd,
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
