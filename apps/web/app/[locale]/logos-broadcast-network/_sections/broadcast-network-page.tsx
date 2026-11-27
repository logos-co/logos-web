'use client'

import { EventsCalendar } from '@/components/sections/events-calendar/events-calendar'
import type { BlogPodcastRow } from '@/lib/blog-engine'
import type { BroadcastEventRow } from '@repo/content/calendar'

import { BroadcastHero } from './broadcast-hero'
import { EventCards } from './event-cards'
import { PastEpisodes } from './past-episodes'
import type { BroadcastNetworkCopy } from './types'

interface BroadcastNetworkPageProps {
  events: BroadcastEventRow[]
  podcasts: BlogPodcastRow[]
  referenceTime: number
  copy: BroadcastNetworkCopy
}

export function BroadcastNetworkPage({
  events,
  podcasts,
  referenceTime,
  copy,
}: BroadcastNetworkPageProps) {
  return (
    <div className="bg-accent-tan pt-10">
      <BroadcastHero copy={copy} />
      <EventCards events={events} copy={copy} />
      <EventsCalendar
        events={events}
        referenceTime={referenceTime}
        copy={{
          heading: copy.upcomingEvents,
          yearLabel: copy.calendarYearLabel,
          monthLabel: copy.calendarMonthLabel,
          todayLabel: copy.calendarTodayLabel,
        }}
      />
      <PastEpisodes podcasts={podcasts} copy={copy} />
    </div>
  )
}
