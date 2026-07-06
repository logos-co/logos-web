import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { ResearchCopySection } from '@repo/content/schemas'

import ResearchPageView from '@/components/sections/research/research-page'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.research

const findSection = createSectionFinder('research')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`ResearchPage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)

  const data = findSection<ResearchCopySection>(
    page.sections,
    'researchCopy',
    'research.copy',
  )

  return <ResearchPageView data={data} locale={locale} />
}
