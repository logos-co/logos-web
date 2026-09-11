import type { Metadata } from 'next'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

import { PriFiPage } from './_sections/prifi-page'

const ROUTE = ROUTES.prifi

type PageProps = {
  params: Promise<{ locale: string }>
}

async function resolveLocale(params: PageProps['params'], caller: string) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`${caller} received non-active locale "${locale}"`)
  }
  return locale
}

// The page has no title or description yet, so the site defaults stand in.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params, 'generateMetadata')
  return createDefaultMetadata({ locale, path: ROUTE })
}

export default async function Page({ params }: PageProps) {
  await resolveLocale(params, 'PriFiPage')
  return <PriFiPage />
}
