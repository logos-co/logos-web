import siteConfig from '@/constants/site-config'
import { absoluteUrl } from '@/lib/metadata'

import siteSettings from '../../../content/site/en/settings.json'

type JsonLdPrimitive = boolean | null | number | string
type JsonLdValue =
  | JsonLdPrimitive
  | JsonLdObject
  | ReadonlyArray<JsonLdValue>

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue | undefined
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export function createOrganizationJsonLd(): JsonLdObject {
  const sameAs = [
    siteSettings.social.twitter,
    siteSettings.social.youtube,
    siteSettings.social.github,
  ].filter((url): url is string => Boolean(url))

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl('/apple-touch-icon.png'),
    description: siteConfig.description,
    sameAs,
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
