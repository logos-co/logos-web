import {
  getCircleInitiatives,
  getCircleResources,
  getCirclesSettings,
  getPageCopy,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { MovementCopySection } from '@repo/content/schemas'

import { MovementPageView } from '@/components/sections/movement/movement-page'
import { ROUTES } from '@/constants/routes'
import {
  getActiveCircleMarkers,
  getUpcomingCircleEvents,
} from '@/lib/active-circles'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.movement

const findSection = createSectionFinder('movement')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function MovementPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`MovementPage received non-active locale "${locale}"`)
  }

  const [page, circlesSettings, mapMarkers, upcomingEvents, initiatives, resources] =
    await Promise.all([
      getPageCopy(ROUTE, locale),
      getCirclesSettings(locale),
      getActiveCircleMarkers(),
      getUpcomingCircleEvents(Infinity),
      getCircleInitiatives({ locale, status: 'published' }),
      getCircleResources({ locale, status: 'published' }),
    ])

  const movementCopy = findSection<MovementCopySection>(
    page.sections,
    'movementCopy',
    'movement.copy',
  )

  return (
    <MovementPageView
      data={movementCopy}
      circlesSettings={circlesSettings}
      mapMarkers={mapMarkers}
      upcomingEvents={upcomingEvents}
      initiatives={initiatives}
      resources={resources}
      locale={locale}
    />
  )
}
