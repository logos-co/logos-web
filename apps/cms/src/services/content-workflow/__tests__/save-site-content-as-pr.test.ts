import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildSiteFooterFileChange,
  buildSiteNavigationFileChange,
  buildSiteSettingsFileChange,
} from '../save-site-content-as-pr'

describe('site content fixture builders', () => {
  it('writes site settings to the repo-backed settings file', () => {
    const change = buildSiteSettingsFileChange({
      slug: 'settings',
      settings: {
        schemaVersion: 1,
        language: 'en',
        siteName: 'Logos',
        siteTitle: 'Logos',
        siteDescription: 'A movement.',
        canonicalUrl: 'https://logos.co',
        keywords: ['logos'],
        social: {},
      },
    })

    assert.equal(change.path, 'content/site/en/settings.json')
  })

  it('writes site navigation to the repo-backed navigation file', () => {
    const change = buildSiteNavigationFileChange({
      slug: 'navigation',
      navigation: {
        schemaVersion: 1,
        language: 'en',
        closedBar: {
          brandLabel: 'LOGOS',
          menuLabel: 'MENU',
          closeLabel: 'CLOSE',
          openAriaLabel: 'Open navigation menu',
          closeAriaLabel: 'Close navigation menu',
        },
        sitemap: [{ label: 'Home', href: '/' }],
        communityCards: [],
        press: {
          label: 'Press',
          seeAllLabel: 'SEE ALL',
          seeAllHref: '/press',
        },
      },
    })

    assert.equal(change.path, 'content/site/en/navigation.json')
  })

  it('writes site footer to the repo-backed footer file', () => {
    const change = buildSiteFooterFileChange({
      slug: 'footer',
      footer: {
        schemaVersion: 1,
        language: 'en',
        newsletter: {
          title: 'Subscribe',
          emailLabel: 'Email',
          roleLabel: 'Role',
          cityLabel: 'City',
          submitLabel: 'Submit',
        },
        tagline: 'Pioneering a new era of freedom.',
        image: { src: '/images/home/footer-image.jpg', alt: '' },
        mainLinks: [],
        socialLinks: [],
        researchLinks: [],
        infrastructureLinks: [],
        legalLinks: [],
        builtBy: {
          label: 'Built by',
          attribution: 'IFT',
          href: 'https://free.technology',
        },
      },
    })

    assert.equal(change.path, 'content/site/en/footer.json')
  })
})
