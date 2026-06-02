import Image from 'next/image'

import type { Language } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import type { ActiveCircleUpcomingEvent } from '@/lib/active-circles'

// The live events API returns timezone-naive timestamps and no timezone field.
// Pin naive timestamps to UTC so the wall-clock is interpreted and displayed
// deterministically regardless of the build/runtime machine, and show times
// without a (fabricated) zone label.
const DEFAULT_EVENT_IMAGE = '/images/home/circles-card-bg.webp'

const toUtcInstant = (iso: string): Date => {
  const hasZone = /([zZ])|([+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(hasZone ? iso : `${iso}Z`)
}

const formatEventDate = (iso: string, locale: Language) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
  }).format(toUtcInstant(iso))

const formatEventWeekday = (iso: string, locale: Language) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(toUtcInstant(iso))

const formatEventTime = (iso: string, locale: Language) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(toUtcInstant(iso))

const eventGroupKey = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(toUtcInstant(iso))

type UpcomingEventGroup = {
  key: string
  date: string
  weekday: string
  events: ActiveCircleUpcomingEvent[]
}

const groupUpcomingEvents = (
  events: ActiveCircleUpcomingEvent[],
  locale: Language
): UpcomingEventGroup[] => {
  const groups: UpcomingEventGroup[] = []
  const byKey = new Map<string, UpcomingEventGroup>()

  for (const event of events) {
    const key = eventGroupKey(event.startAt)
    let group = byKey.get(key)
    if (!group) {
      group = {
        key,
        date: formatEventDate(event.startAt, locale),
        weekday: formatEventWeekday(event.startAt, locale),
        events: [],
      }
      byKey.set(key, group)
      groups.push(group)
    }
    group.events.push(event)
  }

  return groups
}

function EventCard({
  event,
  locale,
}: {
  event: ActiveCircleUpcomingEvent
  locale: Language
}) {
  const time = formatEventTime(event.startAt, locale)
  const location = [event.city, event.country].filter(Boolean).join(', ')

  const className =
    'grid w-full grid-cols-[123px_minmax(0,1fr)] gap-3 rounded-[24px] bg-gray-01 p-1.5 pr-6 text-brand-dark-green transition-colors hover:bg-gray-02 md:w-[463px]'

  const content = (
    <>
      <div className="relative size-[123px] overflow-hidden rounded-[18px]">
        <Image
          src={DEFAULT_EVENT_IMAGE}
          alt=""
          fill
          sizes="123px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-between py-1">
        <h3 className="truncate font-sans text-[18px] leading-[1.15] tracking-normal">
          {event.name}
        </h3>
        <div className="flex flex-col gap-0.5">
          <p className="text-mono-s text-brand-dark-green">{time}</p>
          {location ? (
            <p className="text-mono-s truncate text-gray-05">{location}</p>
          ) : null}
        </div>
      </div>
    </>
  )

  if (event.eventUrl) {
    return (
      <a
        href={event.eventUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}

export function UpcomingEventsSection({
  title,
  description,
  cta,
  events,
  locale,
}: {
  title: string
  description?: string
  cta?: { label: string; href: string; external?: boolean }
  events: ActiveCircleUpcomingEvent[]
  locale: Language
}) {
  const groups = groupUpcomingEvents(events, locale)

  return (
    <section
      id="events"
      className="border-t border-brand-dark-green/10 bg-brand-off-white"
    >
      <ContentWidth className="grid grid-cols-2 gap-3 px-3 py-10 md:grid-cols-12 md:py-10">
        <h2 className="font-display text-[30px] leading-none text-brand-dark-green md:col-span-4 md:text-[36px]">
          {title}
        </h2>
        {description ? (
          <p className="text-mono-s col-start-2 text-brand-dark-green md:col-span-3 md:col-start-7 md:w-[226px]">
            {description}
          </p>
        ) : null}
        {cta ? (
          <Button
            href={cta.href}
            variant="link"
            className="col-start-2 w-fit self-start md:col-span-2 md:col-start-11"
            {...(cta.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {cta.label}
          </Button>
        ) : null}
      </ContentWidth>

      {groups.length === 0 ? (
        <ContentWidth>
          <p className="text-mono-s border-t border-brand-dark-green/10 px-3 py-10 text-brand-dark-green">
            No upcoming events right now. Check back soon.
          </p>
        </ContentWidth>
      ) : (
        <ContentWidth className="flex flex-col gap-6 pb-12">
          {groups.map((group) => (
            <div
              key={group.key}
              className="grid gap-3 border-t border-brand-dark-green/10 px-3 pt-3 md:grid-cols-12"
            >
              <p className="text-eyebrow text-brand-dark-green md:col-span-2">
                {group.date}{' '}
                <span className="font-normal">/ {group.weekday}</span>
              </p>
              <div className="flex flex-col gap-3 md:col-span-8 md:col-start-3 md:flex-row md:flex-wrap">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} locale={locale} />
                ))}
              </div>
            </div>
          ))}
        </ContentWidth>
      )}
    </section>
  )
}
