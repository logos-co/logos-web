import type { ReactNode } from 'react'

import { ExternalLink } from '@/components/ui'
import type { BroadcastEventRow } from '@repo/content/calendar'

import {
  formatLocalTime,
  formatUtcOffsetLabel,
  parseCalendarKey,
} from './calendar-dates'
import type { EventDetailsCopy } from './types'

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatDayHeading(dayKey: string) {
  const { year, month, day } = parseCalendarKey(dayKey)
  return DATE_FORMAT.format(new Date(year, month, day))
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1 md:grid-cols-[120px_1fr] md:gap-4">
      <dt className="font-mono text-xs font-semibold uppercase leading-[1.35]">
        {label}
      </dt>
      <dd className="text-mono-s min-w-0 text-black">{children}</dd>
    </div>
  )
}

function EventTimeLabel({ event }: { event: BroadcastEventRow }) {
  if (event.timeMinutes === null) return null

  const localDateTime = new Date(event.localTimestamp)
  return (
    <span>
      {formatLocalTime(localDateTime)} ({formatUtcOffsetLabel(localDateTime)})
    </span>
  )
}

function EventDetailItem({
  event,
  copy,
}: {
  event: BroadcastEventRow
  copy: EventDetailsCopy
}) {
  return (
    <li className="flex flex-col gap-4 border-t border-brand-dark-green/20 pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-medium leading-[1.3]">
        {event.typeLabel ? (
          <span className="rounded-lg border border-brand-dark-green/50 px-2 py-1">
            {event.typeLabel}
          </span>
        ) : null}
        <EventTimeLabel event={event} />
      </div>
      {event.topic ? (
        <h4 className="font-sans text-[20px] leading-[1.2] tracking-[-0.01em]">
          {event.topic}
        </h4>
      ) : null}
      <dl className="flex flex-col gap-3">
        {event.guest ? (
          <DetailRow label={copy.guest}>{event.guest}</DetailRow>
        ) : null}
        {event.speakers.length > 0 ? (
          <DetailRow label={copy.speakers}>
            {event.speakers.join(', ')}
          </DetailRow>
        ) : null}
        {event.notes ? (
          <DetailRow label={copy.notes}>{event.notes}</DetailRow>
        ) : null}
        {event.links.length > 0 ? (
          <DetailRow label={copy.links}>
            <span className="flex flex-col gap-1">
              {event.links.map((link) => (
                <ExternalLink
                  key={link}
                  href={link}
                  className="cursor-pointer break-all underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                  {link}
                </ExternalLink>
              ))}
            </span>
          </DetailRow>
        ) : null}
      </dl>
    </li>
  )
}

interface EventDetailsProps {
  dayKey: string
  events: BroadcastEventRow[]
  copy: EventDetailsCopy
}

export function EventDetails({ dayKey, events, copy }: EventDetailsProps) {
  return (
    <section
      aria-live="polite"
      className="mt-6 rounded-xl border border-brand-dark-green/50 p-4 text-brand-dark-green md:p-6"
    >
      <h3 className="font-sans text-[24px] leading-none tracking-[-0.02em]">
        {formatDayHeading(dayKey)}
      </h3>
      {events.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-6">
          {events.map((event) => (
            <EventDetailItem key={event.id} event={event} copy={copy} />
          ))}
        </ul>
      ) : (
        <p className="text-mono-s mt-6 text-black">{copy.empty}</p>
      )}
    </section>
  )
}
