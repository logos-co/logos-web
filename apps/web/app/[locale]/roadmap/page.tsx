import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { RoadmapCopySection } from '@repo/content/schemas'

import { RoadmapPage } from '@/components/sections/roadmap'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.roadmap

export const generateMetadata = createPageMetadata(ROUTE)

const findSection = createSectionFinder('roadmap')

export default async function RoadmapRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`RoadmapRoutePage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)
  const data = findSection<RoadmapCopySection>(
    page.sections,
    'roadmapCopy',
    'roadmap.copy'
  )

  return <RoadmapPage data={data} />
}
