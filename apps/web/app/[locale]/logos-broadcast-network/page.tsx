import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { BroadcastCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { getBroadcastEvents, getLatestBlogPodcasts } from '@/lib/blog-engine'

import { BroadcastNetworkPage } from './_sections/broadcast-network-page'

const ROUTE = ROUTES.logosBroadcastNetwork

const findSection = createSectionFinder('logos-broadcast-network')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function LogosBroadcastNetworkPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `LogosBroadcastNetworkPage received non-active locale "${locale}"`
    )
  }

  const [page, podcasts, events] = await Promise.all([
    getPageCopy(ROUTE, locale),
    getLatestBlogPodcasts(20),
    getBroadcastEvents(),
  ])

  if (podcasts.length === 0) {
    throw new Error(
      'Broadcast page requires at least one podcast from blog API'
    )
  }

  const data = findSection<BroadcastCopySection>(
    page.sections,
    'broadcastCopy',
    'logosBroadcastNetwork.copy',
  )

  return (
    <BroadcastNetworkPage
      podcasts={podcasts}
      events={events}
      copy={{
        title: data.heading,
        introPrimary: data.intro.primary,
        introSecondary: data.intro.secondary,
        eventFallbackDescription: data.events.fallbackDescription,
        eventHost: data.events.host,
        eventNextShow: data.events.nextShow,
        upcomingEvents: data.events.heading,
        calendarYearLabel: data.events.yearLabel,
        calendarMonthLabel: data.events.monthLabel,
        calendarTodayLabel: data.events.todayLabel,
        pastEpisodes: data.pastEpisodes.heading,
        listenOnApp: data.listenOnApp,
      }}
    />
  )
}
