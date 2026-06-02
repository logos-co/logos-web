'use client'

import type { BroadcastEventRow, BlogPodcastRow } from '@/lib/blog-engine'

import { BroadcastHero } from './broadcast-hero'
import { EventCards } from './event-cards'
import { EventsCalendar } from './events-calendar'
import { PastEpisodes } from './past-episodes'
import type { BroadcastNetworkCopy } from './types'

interface BroadcastNetworkPageProps {
  podcasts: BlogPodcastRow[]
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}

export function BroadcastNetworkPage({
  podcasts,
  events,
  copy,
}: BroadcastNetworkPageProps) {
  return (
    <div className="bg-accent-tan pt-10">
      <BroadcastHero copy={copy} />
      <EventCards events={events} copy={copy} />
      <EventsCalendar events={events} copy={copy} />
      <PastEpisodes podcasts={podcasts} copy={copy} />
    </div>
  )
}
