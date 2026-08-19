import { notFound } from 'next/navigation'

import {
  ContentNotFoundError,
  flattenFieldGuideItems,
  getFieldGuideChapter,
  getFieldGuideManifest,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { FieldGuidePageView } from '@/components/sections/field-guide'
import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import siteConfig from '@/constants/site-config'
import { routing } from '@/i18n/routing'
import { createDefaultMetadata } from '@/lib/metadata'
import { createBreadcrumbListJsonLd } from '@/lib/structured-data'

const INDEX_SLUG = 'index'

export const dynamicParams = false

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []
  for (const locale of routing.locales) {
    if (!isActiveLocale(locale)) continue
    const manifest = await getFieldGuideManifest(locale)
    for (const item of flattenFieldGuideItems(manifest)) {
      // The index chapter is served by the parent `/field-guide` route.
      if (item.slug === INDEX_SLUG) continue
      params.push({ locale, slug: item.slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  const manifest = await getFieldGuideManifest(locale)
  const item = flattenFieldGuideItems(manifest).find((it) => it.slug === slug)
  const chapterTitle = item
    ? `${item.title} — ${manifest.title}`
    : manifest.title
  const description = manifest.seo.chapterDescriptionTemplate
    .replace('{title}', item?.title ?? manifest.title)
    .replace('{guide}', manifest.title)
  return createDefaultMetadata({
    title: chapterTitle,
    description,
    locale,
    path: ROUTES.fieldGuideChapter(slug),
  })
}

export default async function FieldGuideChapterPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `FieldGuideChapterPage received non-active locale "${locale}"`
    )
  }

  try {
    const [manifest, body] = await Promise.all([
      getFieldGuideManifest(locale),
      getFieldGuideChapter(locale, slug),
    ])
    const item = flattenFieldGuideItems(manifest).find(
      (chapter) => chapter.slug === slug
    )
    if (!item) notFound()

    return (
      <>
        <JsonLd
          data={createBreadcrumbListJsonLd(
            [
              { name: siteConfig.name, path: ROUTES.home },
              { name: manifest.title, path: ROUTES.fieldGuide },
              { name: item.title, path: ROUTES.fieldGuideChapter(slug) },
            ],
            locale
          )}
        />
        <FieldGuidePageView manifest={manifest} slug={slug} body={body} />
      </>
    )
  } catch (error) {
    if (error instanceof ContentNotFoundError) notFound()
    throw error
  }
}
