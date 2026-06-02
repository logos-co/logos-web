import { getTranslations } from 'next-intl/server'
import { getCircleInitiatives, getCirclesSettings } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { MovementPageView } from '@/components/sections/movement/movement-page'
import { ROUTES } from '@/constants/routes'
import {
  getActiveCircleMarkers,
  getUpcomingCircleEvents,
} from '@/lib/active-circles'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.movement'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.movement,
})

export default async function MovementPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`MovementPage received non-active locale "${locale}"`)
  }

  const t = await getTranslations({ locale, namespace: NAMESPACE })
  const [circlesSettings, mapMarkers, upcomingEvents, initiatives] =
    await Promise.all([
      getCirclesSettings(locale),
      getActiveCircleMarkers(),
      getUpcomingCircleEvents(),
      getCircleInitiatives({ locale, status: 'published' }),
    ])

  return (
    <MovementPageView
      t={t}
      circlesSettings={circlesSettings}
      mapMarkers={mapMarkers}
      upcomingEvents={upcomingEvents}
      initiatives={initiatives}
      locale={locale}
    />
  )
}
