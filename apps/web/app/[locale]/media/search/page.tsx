import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'
import { getMediaSearchIndex } from '@/lib/media-search-index'

import { MediaSearchSection } from './_sections/media-search-section'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `MediaSearchPage metadata received non-active locale "${locale}"`
    )
  }

  const t = await getTranslations('mediaSearch')
  return createDefaultMetadata({
    title: t('metadataTitle'),
    description: t('metadataDescription'),
    locale,
    noindex: true,
    path: ROUTES.mediaSearch,
  })
}

export default async function MediaSearchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`MediaSearchPage received non-active locale "${locale}"`)
  }

  const entries = await getMediaSearchIndex()

  return (
    <Suspense>
      <MediaSearchSection entries={entries} locale={locale} />
    </Suspense>
  )
}
