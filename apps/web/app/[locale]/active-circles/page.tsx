import { isActiveLocale } from '@repo/content/locales'

import { ActiveCirclesPageView } from '@/components/sections/active-circles'
import { ROUTES } from '@/constants/routes'
import { getActiveCirclesOverview } from '@/lib/active-circles'
import { createDefaultMetadata } from '@/lib/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `ActiveCirclesPage metadata received non-active locale "${locale}"`
    )
  }

  return createDefaultMetadata({
    title: 'Active Circles | Logos',
    description: 'Circles and contributions across the Logos network.',
    locale,
    path: ROUTES.activeCircles,
  })
}

export default async function ActiveCirclesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`ActiveCirclesPage received non-active locale "${locale}"`)
  }

  const overview = await getActiveCirclesOverview()

  return <ActiveCirclesPageView {...overview} />
}
