/**
 * schema.org data for the campaign page.
 *
 * Kept local to the route rather than in `lib/structured-data.ts`: the shared
 * helpers land with the site-wide SEO work on `web/seo-updates`, and the parts
 * that matter here — the citation list — are campaign-specific anyway. Fold
 * this into the shared module once that work is on `develop`.
 *
 * `datePublished` is deliberately absent. Article rich results want one, but a
 * guessed date is worse than none; add the real launch date here when the page
 * goes live.
 */
import siteConfig from '@/constants/site-config'
import { ROUTES } from '@/constants/routes'
import { absoluteUrl } from '@/lib/metadata'

import { CASE_FILE, HERO } from './_content'

type JsonLdValue =
  | boolean
  | null
  | number
  | string
  | JsonLdObject
  | ReadonlyArray<JsonLdValue>

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue | undefined
}

/** Subjects the page argues about, for `about` / topical relevance. */
const SUBJECTS = [
  'Chat Control',
  'EU Child Sexual Abuse Regulation',
  'Age verification',
  'Client-side scanning',
  'End-to-end encryption',
  'Online Safety Act',
] as const

export const PAGE_KEYWORDS = [
  'Chat Control',
  'EU CSA Regulation',
  'age verification',
  'client-side scanning',
  'end-to-end encryption',
  'Online Safety Act',
  'digital privacy',
  'Logos',
] as const

/** The page's own name, as it reads in the headline. */
const PAGE_NAME = `${HERO.headlineLine1} ${HERO.headlineLine2}`

export function createCampaignArticleJsonLd(locale: string): JsonLdObject {
  const url = absoluteUrl(ROUTES.catchNoOne, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: PAGE_NAME,
    description: HERO.intro,
    inLanguage: locale,
    isAccessibleForFree: true,
    // The same asset the social cards use. Article rich results need an image;
    // swap this for a campaign-specific one if the design lands.
    image: [absoluteUrl('/og.jpeg')],
    author: { '@type': 'Organization', name: siteConfig.name },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: absoluteUrl(''),
      logo: absoluteUrl('/apple-touch-icon.png'),
    },
    about: SUBJECTS.map((name) => ({ '@type': 'Thing', name })),
    // Every claim on the page is sourced; expose the sources as citations so
    // the relationship survives outside the rendered list.
    citation: CASE_FILE.sources.map((source) => ({
      '@type': 'ScholarlyArticle',
      name: source.text,
      url: source.href,
    })),
  }
}

export function createCampaignBreadcrumbJsonLd(locale: string): JsonLdObject {
  const trail = [
    { name: siteConfig.name, path: ROUTES.home },
    { name: PAGE_NAME, path: ROUTES.catchNoOne },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  }
}

/** Renders one JSON-LD block, escaping `<` so the script cannot be closed early. */
export function JsonLd({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
