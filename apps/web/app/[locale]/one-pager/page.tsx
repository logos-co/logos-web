import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

import { OnePagerUpload } from './_sections/one-pager-upload'

const ROUTE = ROUTES.onePager

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  const t = await getTranslations({ locale, namespace: 'pages.onePager' })

  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTE,
    // Reached only through a signed link in an email; nothing here is public.
    noindex: true,
  })
}

export default async function OnePagerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`OnePagerPage received non-active locale "${locale}"`)
  }

  return (
    // `useSearchParams` inside the section suspends, and a static export fails
    // to build without a boundary above it.
    <Suspense>
      <OnePagerUpload />
    </Suspense>
  )
}
