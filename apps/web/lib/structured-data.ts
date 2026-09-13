import siteConfig from '@/constants/site-config'
import { absoluteUrl } from '@/lib/metadata'

import siteSettings from '../../../content/site/en/settings.json'

type JsonLdPrimitive = boolean | null | number | string
type JsonLdValue = JsonLdPrimitive | JsonLdObject | ReadonlyArray<JsonLdValue>

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue | undefined
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export function createOrganizationJsonLd(): JsonLdObject {
  // Every owned profile configured in site settings belongs here. "Logos"
  // collides with the common noun for logo design — the query `logos` draws
  // ~32K impressions a quarter at under 1% CTR — so the entity signals are
  // what tell Google which Logos this is. Discord was configured in
  // settings.json but never reached the graph.
  const sameAs = [
    siteSettings.social.twitter,
    siteSettings.social.youtube,
    siteSettings.social.github,
    siteSettings.social.discord,
  ].filter((url): url is string => Boolean(url))

  // absoluteUrl('') is the trailing-slash-normalised site origin, so the entity
  // id matches the canonical URLs emitted everywhere else.
  const siteUrl = absoluteUrl('')

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteConfig.name,
    url: siteUrl,
    logo: absoluteUrl('/apple-touch-icon.png'),
    description: siteConfig.description,
    sameAs,
  }
}

/**
 * `WebSite` node for the homepage, linked to the `Organization` as its
 * publisher. Together the two give Google an explicit site-level entity to
 * attach the brand name to, which the site had no node for at all.
 */
export function createWebSiteJsonLd(): JsonLdObject {
  const siteUrl = absoluteUrl('')

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteConfig.name,
    alternateName: siteConfig.title,
    description: siteConfig.description,
    inLanguage: siteConfig.defaultLocale,
    publisher: { '@id': `${siteUrl}/#organization` },
  }
}

export function createBreadcrumbListJsonLd(
  items: ReadonlyArray<BreadcrumbItem>,
  locale: string
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  }
}

export interface EventJsonLdInput {
  /** Canonical path of the page describing the event. */
  path: string
  name: string
  description: string
  /** Absolute URL of the share image. */
  image: string
  /** ISO 8601 dates. */
  startDate: string
  endDate: string
  place: { name: string; region: string; countryCode: string }
  /** Co-organisers alongside Logos. */
  partners?: ReadonlyArray<string>
}

/**
 * schema.org Event for an in-person programme. Logos is listed as organiser
 * with the same `@id` as the homepage Organization entity.
 */
export function createEventJsonLd(input: EventJsonLdInput): JsonLdObject {
  const siteUrl = absoluteUrl('')
  const pageUrl = absoluteUrl(input.path)

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${pageUrl}#event`,
    name: input.name,
    description: input.description,
    url: pageUrl,
    image: input.image,
    startDate: input.startDate,
    endDate: input.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: input.place.name,
      address: {
        '@type': 'PostalAddress',
        addressRegion: input.place.region,
        addressCountry: input.place.countryCode,
      },
    },
    organizer: [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteConfig.name,
        url: siteUrl,
      },
      ...(input.partners ?? []).map((name) => ({
        '@type': 'Organization',
        name,
      })),
    ],
  }
}
