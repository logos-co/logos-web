import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'
import {
  FIELD_STATION_LEGAL_LINKS,
  findPageLegalLinks,
} from '@/lib/page-legal-links'

describe('findPageLegalLinks', () => {
  test.each([
    ROUTES.fieldStation,
    `${ROUTES.fieldStation}/`,
    ROUTES.fieldStationTerms,
    ROUTES.fieldStationPrivacy,
  ])('returns the Field Station documents on %s', (pathname) => {
    expect(findPageLegalLinks(pathname)).toBe(FIELD_STATION_LEGAL_LINKS)
  })

  test.each([
    ROUTES.home,
    ROUTES.privacy,
    ROUTES.fieldGuide,
    `${ROUTES.fieldStation}-archive`,
  ])('returns nothing on %s', (pathname) => {
    expect(findPageLegalLinks(pathname)).toBeUndefined()
  })
})

describe('Field Station legal links', () => {
  test('point at the application terms and privacy policy', () => {
    expect(FIELD_STATION_LEGAL_LINKS.links.map((link) => link.href)).toEqual([
      ROUTES.fieldStationTerms,
      ROUTES.fieldStationPrivacy,
    ])
  })

  test('live under the Field Station route', () => {
    for (const { href } of FIELD_STATION_LEGAL_LINKS.links) {
      expect(href.startsWith(`${ROUTES.fieldStation}/`)).toBe(true)
    }
  })
})
