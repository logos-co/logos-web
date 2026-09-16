import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { PrifiCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { PriFiPage } from './_sections/prifi-page'

const ROUTE = ROUTES.prifi
const findSection = createSectionFinder('prifi')

type PageProps = {
  params: Promise<{ locale: string }>
}

export const generateMetadata = createPageMetadata(ROUTE)

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`PriFiPage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)
  const copy = findSection<PrifiCopySection>(
    page.sections,
    'prifiCopy',
    'prifi.copy'
  )

  return <PriFiPage copy={copy} />
}
