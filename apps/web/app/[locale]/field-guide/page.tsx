import {
  getFieldGuideChapter,
  getFieldGuideManifest,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { FieldGuidePageView } from '@/components/sections/field-guide'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

const INDEX_SLUG = 'index'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  const manifest = await getFieldGuideManifest(locale)
  return createDefaultMetadata({
    title: manifest.seo.title,
    description: manifest.seo.description,
    locale,
    path: ROUTES.fieldGuide,
  })
}

export default async function FieldGuideIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`FieldGuideIndexPage received non-active locale "${locale}"`)
  }

  const [manifest, body] = await Promise.all([
    getFieldGuideManifest(locale),
    getFieldGuideChapter(locale, INDEX_SLUG),
  ])

  return <FieldGuidePageView manifest={manifest} slug={INDEX_SLUG} body={body} />
}
