import { getTranslations } from 'next-intl/server'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'
import { getBroadcastEvents, getLatestBlogPodcasts } from '@/lib/blog-engine'

import { BroadcastNetworkPage } from './_sections/broadcast-network-page'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'pages.logosBroadcastNetwork',
  })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.logosBroadcastNetwork,
  })
}

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

  const [t, podcasts, events] = await Promise.all([
    getTranslations({
      locale,
      namespace: 'pages.logosBroadcastNetwork',
    }),
    getLatestBlogPodcasts(20),
    getBroadcastEvents(),
  ])

  if (podcasts.length === 0) {
    throw new Error(
      'Broadcast page requires at least one podcast from blog API'
    )
  }

  return (
    <BroadcastNetworkPage
      podcasts={podcasts}
      events={events}
      copy={{
        title: t('heading'),
        introPrimary: t('intro.primary'),
        introSecondary: t('intro.secondary'),
        eventFallbackDescription: t('events.fallbackDescription'),
        eventHost: t('events.host'),
        eventNextShow: t('events.nextShow'),
        upcomingEvents: t('events.heading'),
        calendarYearLabel: t('events.yearLabel'),
        calendarMonthLabel: t('events.monthLabel'),
        calendarTodayLabel: t('events.todayLabel'),
        pastEpisodes: t('pastEpisodes.heading'),
        listenOnApp: t('listenOnApp'),
      }}
    />
  )
}
