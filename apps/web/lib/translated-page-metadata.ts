/**
 * Builds the `generateMetadata` async export for pages whose copy is keyed
 * into next-intl messages (rather than the PageCopy JSON system used by
 * `createPageMetadata`). Removes the metadata half of the
 * "namespace string repeated twice in one file" pattern and saves ~10 lines
 * per page.
 *
 * Usage:
 *   import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'
 *   const NAMESPACE = 'pages.designGuide'
 *   export const generateMetadata = createTranslatedPageMetadata({
 *     namespace: NAMESPACE,
 *     path: ROUTES.designGuide,
 *   })
 */
import { getTranslations } from 'next-intl/server'

import { createDefaultMetadata } from '@/lib/metadata'

type RouteParams = { params: Promise<{ locale: string }> }

type TranslatedPageMetadataConfig = {
  /** next-intl namespace; must contain `title` and `description` keys. */
  namespace: string
  /** Canonical route path from `ROUTES`. */
  path: string
  /** Optional override for the title key (default `'title'`). */
  titleKey?: string
  /** Optional override for the description key (default `'description'`). */
  descriptionKey?: string
}

export function createTranslatedPageMetadata({
  namespace,
  path,
  titleKey = 'title',
  descriptionKey = 'description',
}: TranslatedPageMetadataConfig) {
  return async function generateMetadata({ params }: RouteParams) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace })
    return createDefaultMetadata({
      title: t(titleKey),
      description: t(descriptionKey),
      locale,
      path,
    })
  }
}
