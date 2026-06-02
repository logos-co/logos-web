import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { ExternalLink } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { BroadcastEventRow } from '@/lib/blog-engine'

import { compareEvents } from './atoms'
import type { BroadcastNetworkCopy } from './types'

const FEATURE_IMAGES = [
  '/images/home/event-1.jpg',
  '/images/home/event-2.jpg',
  '/images/home/event-3.jpg',
  '/images/home/event-4.jpg',
  '/images/blog-engine/hero-thumb.png',
  '/images/blog-engine/list-1.png',
]

function getUpcomingEvents(events: BroadcastEventRow[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const upcomingEvents = events.filter(
    (event) => event.localTimestamp >= today.getTime()
  )

  return (upcomingEvents.length > 0 ? upcomingEvents : events)
    .slice()
    .sort(compareEvents)
    .slice(0, 6)
}

function EventCard({
  event,
  copy,
  image,
}: {
  event: BroadcastEventRow
  copy: BroadcastNetworkCopy
  image: string
}) {
  const content = (
    <>
      <div className="relative size-32 shrink-0 overflow-hidden rounded-[18px]">
        <Image src={image} alt="" fill sizes="128px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-col gap-3 py-1">
        <h2 className="truncate font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
          {event.title}
        </h2>
        <p className="line-clamp-2 font-sans text-[14px] leading-[1.2] text-black">
          {event.description || copy.eventFallbackDescription}
        </p>
        <div className="text-mono-s flex flex-col gap-0.5">
          <div className="grid grid-cols-[54px_1fr] gap-6">
            <span className="text-brand-dark-green/50">{copy.eventHost}</span>
            <span className="truncate">{event.host}</span>
          </div>
          <div className="grid grid-cols-[54px_1fr] gap-6">
            <span className="text-brand-dark-green/50">
              {copy.eventNextShow}
            </span>
            <span>{event.dateLabel}</span>
          </div>
        </div>
      </div>
    </>
  )

  const className =
    'flex min-w-0 items-center gap-3 rounded-3xl bg-brand-off-white/50 py-1.5 pl-1.5 pr-6 text-brand-dark-green transition-colors hover:bg-brand-yellow'

  return event.link ? (
    <ExternalLink href={event.link} className={cn(className, 'cursor-pointer')}>
      {content}
    </ExternalLink>
  ) : (
    <div className={className}>{content}</div>
  )
}

export function EventCards({
  events,
  copy,
}: {
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}) {
  const displayEvents = getUpcomingEvents(events)

  return (
    <section className="bg-accent-tan px-3 pb-10">
      <ContentWidth className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {displayEvents.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            copy={copy}
            image={FEATURE_IMAGES[index % FEATURE_IMAGES.length]}
          />
        ))}
      </ContentWidth>
    </section>
  )
}
