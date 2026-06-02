import {
  getCircleEventsGroupedByDate,
  getCircleInitiatives,
  getCircleResources,
  getCircles,
  getCirclesSettings,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { CirclesPageView } from '@/components/sections/circles'
import { ROUTES } from '@/constants/routes'
import { getActiveCircleMarkers } from '@/lib/active-circles'
import { createPageMetadata } from '@/lib/page-metadata'

const ROUTE = ROUTES.circles

export const generateMetadata = createPageMetadata(ROUTE)

export default async function CirclesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`CirclesPage received non-active locale "${locale}"`)
  }

  const [settings, circles, mapMarkers, eventGroups, initiatives, resources] =
    await Promise.all([
      getCirclesSettings(locale),
      getCircles({ locale, status: 'published' }),
      getActiveCircleMarkers(),
      getCircleEventsGroupedByDate({ locale, status: 'published' }),
      getCircleInitiatives({ locale, status: 'published' }),
      getCircleResources({ locale, status: 'published' }),
    ])

  return (
    <CirclesPageView
      settings={settings}
      circles={circles}
      mapMarkers={mapMarkers}
      eventGroups={eventGroups}
      initiatives={initiatives}
      resources={resources}
      locale={locale}
    />
  )
}
