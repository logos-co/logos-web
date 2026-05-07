/**
 * Builds the `generateMetadata` async function used by every PageCopy-driven
 * route in `apps/web/app/[locale]/**`. The pattern is identical across all
 * such pages — assert active locale, load `getPageCopy(route, locale)`, and
 * return a `createDefaultMetadata` envelope keyed off the SEO fields with
 * page-title/description fallbacks. Centralising it here removes ~16 lines
 * of boilerplate per route.
 *
 * Usage:
 *   import { createPageMetadata } from '@/lib/page-metadata'
 *   const ROUTE = ROUTES.blockchain
 *   export const generateMetadata = createPageMetadata(ROUTE)
 */
import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { createDefaultMetadata } from '@/lib/metadata'

type RouteParams = { params: Promise<{ locale: string }> }

/**
 * Build a Next.js `generateMetadata` async export bound to a canonical route.
 *
 * @param route Canonical path string from `ROUTES`. Used both as the lookup
 *              key for `getPageCopy` and as the `path` field of the resulting
 *              metadata object.
 */
export function createPageMetadata(route: string) {
  return async function generateMetadata({ params }: RouteParams) {
    const { locale } = await params
    if (!isActiveLocale(locale)) {
      throw new Error(
        `generateMetadata received non-active locale "${locale}"`,
      )
    }
    const page = await getPageCopy(route, locale)
    return createDefaultMetadata({
      title: page.seo?.metaTitle ?? page.title,
      description: page.seo?.metaDescription ?? page.description,
      locale,
      path: route,
    })
  }
}
