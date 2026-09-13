import siteConfig from '@/constants/site-config'
import { ROUTES } from '@/constants/routes'
import { absoluteUrl } from '@/lib/metadata'
import {
  createBreadcrumbListJsonLd,
  createEventJsonLd,
  type JsonLdObject,
} from '@/lib/structured-data'

import { EVENT_DETAILS, OG_IMAGE, SEO } from './_content'

export function createFieldStationBreadcrumbJsonLd(
  locale: string
): JsonLdObject {
  return createBreadcrumbListJsonLd(
    [
      { name: siteConfig.name, path: ROUTES.home },
      { name: EVENT_DETAILS.name, path: ROUTES.fieldStation },
    ],
    locale
  )
}

/** schema.org Event for the residency, so search can show the dates and place. */
export function createFieldStationEventJsonLd(): JsonLdObject {
  return createEventJsonLd({
    path: ROUTES.fieldStation,
    name: EVENT_DETAILS.name,
    description: SEO.description,
    image: absoluteUrl(OG_IMAGE.src),
    startDate: EVENT_DETAILS.startDate,
    endDate: EVENT_DETAILS.endDate,
    place: {
      name: EVENT_DETAILS.venue,
      region: EVENT_DETAILS.region,
      countryCode: EVENT_DETAILS.countryCode,
    },
    partners: [EVENT_DETAILS.partner],
  })
}
