import type { FooterLink } from '@acid-info/logos-ui'

import { ROUTES } from '@/constants/routes'

/**
 * Legal documents that belong to one programme rather than the whole site.
 * The footer lists them beside the site-wide legal links, but only on the
 * programme's own pages.
 */
export interface PageLegalLinks {
  label: string
  links: readonly FooterLink[]
}

export const FIELD_STATION_LEGAL_LINKS: PageLegalLinks = {
  label: 'Field Station',
  links: [
    { label: 'Application Terms', href: ROUTES.fieldStationTerms },
    { label: 'Privacy Policy', href: ROUTES.fieldStationPrivacy },
  ],
}

const PAGE_LEGAL_LINKS: ReadonlyArray<{
  route: string
  legalLinks: PageLegalLinks
}> = [{ route: ROUTES.fieldStation, legalLinks: FIELD_STATION_LEGAL_LINKS }]

const isWithinRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`)

/** Programme legal links for a locale-free pathname, if it has any. */
export function findPageLegalLinks(
  pathname: string
): PageLegalLinks | undefined {
  return PAGE_LEGAL_LINKS.find(({ route }) => isWithinRoute(pathname, route))
    ?.legalLinks
}
