import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { JsonLd } from '@/components/seo/json-ld'
import siteConfig from '@/constants/site-config'
import {
  createBreadcrumbListJsonLd,
  createOrganizationJsonLd,
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
