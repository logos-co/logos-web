'use client'

import { FooterLinkList } from '@acid-info/logos-ui'

import { Link, usePathname } from '@/i18n/navigation'
import { findPageLegalLinks } from '@/lib/page-legal-links'

/**
 * The footer is shared by every page, so the programme-specific legal links
 * are picked from the current route on the client.
 */
export function SiteFooterPageLegalLinks() {
  const legalLinks = findPageLegalLinks(usePathname())

  if (!legalLinks) {
    return null
  }

  return (
    <FooterLinkList
      label={legalLinks.label}
      links={legalLinks.links}
      linkAs={Link}
    />
  )
}
