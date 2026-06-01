'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import ContentWidth from '@/components/layout/content-width'
import { ExternalLink } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { BroadcastEventRow, PressPodcastRow } from '@/lib/press-engine'

interface BroadcastNetworkCopy {
  title: string
  introPrimary: string
  introSecondary: string
  eventFallbackDescription: string
  eventHost: string
  eventNextShow: string
  upcomingEvents: string
  calendarYearLabel: string
  calendarMonthLabel: string
  calendarTodayLabel: string
  pastEpisodes: string
  listenOnApp: string
}

interface BroadcastNetworkPageProps {
  podcasts: PressPodcastRow[]
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}

interface CalendarDay {
  dayNumber: string
  key: string
  isCurrentMonth: boolean
  events: BroadcastEventRow[]
}

const FEATURE_IMAGES = [
  '/images/home/event-1.jpg',
  '/images/home/event-2.jpg',
  '/images/home/event-3.jpg',
  '/images/home/event-4.jpg',
  '/images/press-engine/hero-thumb.png',
  '/images/press-engine/list-1.png',
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function SelectChevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-1/2 h-2 w-3 -translate-y-1/2"
    >
      <span className="absolute left-0 top-[3px] h-[2px] w-[7px] rotate-45 rounded-full bg-brand-dark-green" />
      <span className="absolute right-0 top-[3px] h-[2px] w-[7px] -rotate-45 rounded-full bg-brand-dark-green" />
    </span>
  )
}

function episodeLabel(podcast: PressPodcastRow) {
  return podcast.episodeNumber
    ? `Episode ${podcast.episodeNumber}`
    : 'Logos Podcast'
}

function formatCalendarKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getInitialCalendarDate() {
  const today = new Date()

  return {
    year: today.getFullYear(),
    month: today.getMonth(),
  }
}

function compareEvents(a: BroadcastEventRow, b: BroadcastEventRow) {
  if (a.localTimestamp !== b.localTimestamp) {
    return a.localTimestamp - b.localTimestamp
  }

  const minutesA = a.timeMinutes ?? Number.MAX_SAFE_INTEGER
  const minutesB = b.timeMinutes ?? Number.MAX_SAFE_INTEGER
  if (minutesA !== minutesB) return minutesA - minutesB

  return a.id - b.id
}

function buildCalendarDays(
  events: BroadcastEventRow[],
  year: number,
  month: number
) {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const startOffset = (monthStart.getDay() + 6) % 7
  const endOffset = 6 - ((monthEnd.getDay() + 6) % 7)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(monthStart.getDate() - startOffset)
  const totalDays = startOffset + monthEnd.getDate() + endOffset
  const eventsByDate = new Map<string, BroadcastEventRow[]>()
  const seenTitles = new Map<string, Set<string>>()

  for (const event of events) {
    const dayEvents = eventsByDate.get(event.localDateKey) ?? []
    const titlesForDate = seenTitles.get(event.localDateKey) ?? new Set()
    if (titlesForDate.has(event.calendarTitle)) continue

    titlesForDate.add(event.calendarTitle)
    dayEvents.push(event)
    eventsByDate.set(event.localDateKey, dayEvents)
    seenTitles.set(event.localDateKey, titlesForDate)
  }

  for (const [key, dayEvents] of eventsByDate) {
    eventsByDate.set(key, [...dayEvents].sort(compareEvents))
  }

  const days = Array.from({ length: totalDays }, (_, index): CalendarDay => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)
    const key = formatCalendarKey(date)

    return {
      key,
      dayNumber: String(date.getDate()).padStart(2, '0'),
      isCurrentMonth: date.getMonth() === month,
      events: eventsByDate.get(key) ?? [],
    }
  })

  return { days }
}

function getCalendarYears(events: BroadcastEventRow[]) {
  const currentYear = new Date().getFullYear()
  const years = new Set([currentYear - 1, currentYear, currentYear + 1])

  for (const event of events) {
    years.add(new Date(event.localTimestamp).getFullYear())
  }

  return [...years].sort((a, b) => a - b)
}

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

function PlayIcon() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex size-[30px] shrink-0 items-center justify-center rounded-full border border-brand-dark-green"
    >
      <span className="ml-[2px] h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-brand-dark-green" />
    </span>
  )
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="size-[3px] rounded-full bg-brand-dark-green"
    />
  )
}

function UnderlineLabel({ children }: { children: string }) {
  return (
    <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green underline decoration-brand-dark-green/50 underline-offset-[3px]">
      {children}
    </span>
  )
}

function BroadcastHero({ copy }: { copy: BroadcastNetworkCopy }) {
  return (
    <section className="bg-accent-tan px-3 pb-25 pt-6 text-brand-dark-green md:pt-6">
      <ContentWidth className="flex w-full flex-col gap-10">
        <div className="flex w-full max-w-[1186px] items-start justify-between gap-6">
          <div className="relative h-[86px] w-[107px] shrink-0 overflow-hidden">
            <Image
              src="/images/press-engine/press-hero.jpg"
              alt=""
              fill
              sizes="107px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <p className="text-mono-s w-[226px]">{copy.introPrimary}</p>
        </div>
        <h1 className="font-display text-center text-[56px] leading-none tracking-[-0.03em]">
          <span className="block">Logos Broadcast</span>
          <span className="block">Network</span>
        </h1>
        <div className="flex w-full max-w-[1186px] justify-end">
          <p className="text-mono-s w-[226px]">{copy.introSecondary}</p>
        </div>
      </ContentWidth>
    </section>
  )
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

function EventCards({
  events,
  copy,
}: {
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}) {
  const displayEvents = getUpcomingEvents(events)

  return (
    <section className="bg-accent-tan px-3 pb-10">
      <ContentWidth className="grid grid-cols-3 gap-3">
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

function CalendarCell({ day }: { day: CalendarDay }) {
  return (
    <div
      className={cn(
        'group flex h-[132px] flex-col justify-between overflow-hidden rounded-xl border border-brand-dark-green/50 p-2 text-brand-dark-green transition-colors hover:bg-[#c7f3ff]',
        !day.isCurrentMonth && 'opacity-30'
      )}
    >
      <div className="flex w-full items-center justify-center p-1">
        <span className="flex-1 font-sans text-[14px] leading-[1.2]">
          {day.dayNumber}
        </span>
      </div>
      {day.events.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {day.events.map((event) =>
            event.link ? (
              <ExternalLink
                key={event.id}
                href={event.link}
                className="block cursor-pointer rounded-lg border border-brand-dark-green/50 p-2 font-mono text-[10px] font-medium uppercase leading-[1.3] transition-colors group-hover:bg-[#c7f3ff]"
              >
                <span className="line-clamp-2">{event.calendarTitle}</span>
              </ExternalLink>
            ) : (
              <div
                key={event.id}
                className="block rounded-lg border border-brand-dark-green/50 p-2 font-mono text-[10px] font-medium uppercase leading-[1.3] transition-colors group-hover:bg-[#c7f3ff]"
              >
                <span className="line-clamp-2">{event.calendarTitle}</span>
              </div>
            )
          )}
        </div>
      ) : null}
    </div>
  )
}

function EventsCalendar({
  events,
  copy,
}: {
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}) {
  const initialDate = useMemo(() => getInitialCalendarDate(), [])
  const [calendarDate, setCalendarDate] = useState(initialDate)
  const years = useMemo(() => getCalendarYears(events), [events])
  const { days } = buildCalendarDays(
    events,
    calendarDate.year,
    calendarDate.month
  )

  const goToMonth = (offset: number) => {
    const next = new Date(calendarDate.year, calendarDate.month + offset, 1)
    setCalendarDate({
      year: next.getFullYear(),
      month: next.getMonth(),
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCalendarDate({
      year: today.getFullYear(),
      month: today.getMonth(),
    })
  }

  return (
    <section className="overflow-x-auto bg-accent-tan pt-25 pb-25 text-brand-dark-green">
      <ContentWidth>
        <div className="relative h-[160px] px-3">
          <h2 className="absolute bottom-6 left-3 font-sans text-[36px] leading-none tracking-[-0.02em]">
            {copy.upcomingEvents}
          </h2>
          <div
            className="absolute bottom-6 left-[726px] flex h-[31px] items-center gap-2"
            aria-label={`${copy.calendarMonthLabel} and ${copy.calendarYearLabel}`}
          >
            <label className="relative block h-[31px] w-[141px]">
              <select
                aria-label={copy.calendarMonthLabel}
                value={calendarDate.month}
                onChange={(event) =>
                  setCalendarDate((value) => ({
                    ...value,
                    month: Number(event.target.value),
                  }))
                }
                className="h-full w-full cursor-pointer appearance-none rounded-full border border-transparent bg-brand-off-white py-0 pl-6 pr-10 font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month.toUpperCase()}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </label>
            <label className="relative block h-[31px] w-[131px]">
              <select
                aria-label={copy.calendarYearLabel}
                value={calendarDate.year}
                onChange={(event) =>
                  setCalendarDate((value) => ({
                    ...value,
                    year: Number(event.target.value),
                  }))
                }
                className="h-full w-full cursor-pointer appearance-none rounded-full border border-transparent bg-brand-off-white py-0 pl-6 pr-10 font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </label>
          </div>
          <div className="absolute bottom-6 right-3 flex h-[31px] items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => goToMonth(-1)}
              className="flex h-[31px] w-[39px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[16px] leading-none"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="flex h-[31px] w-[54px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[10px] font-semibold uppercase leading-[1.35]"
            >
              {copy.calendarTodayLabel}
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => goToMonth(1)}
              className="flex h-[31px] w-[39px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[16px] leading-none"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid h-[29px] grid-cols-[repeat(7,192px)] gap-3 px-3">
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              className="flex items-center justify-center font-mono text-[10px] font-semibold uppercase leading-[1.35]"
            >
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(7,192px)] gap-3 px-3 pt-3">
          {days.map((day) => (
            <CalendarCell key={day.key} day={day} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

function EpisodeRow({
  podcast,
  index,
  listenOnApp,
}: {
  podcast: PressPodcastRow
  index: number
  listenOnApp: string
}) {
  const background = index % 2 === 0 ? 'bg-brand-dark-green/10' : 'bg-white/10'

  return (
    <ExternalLink
      href={podcast.href}
      className={cn(
        'group block h-[107px] cursor-pointer text-brand-dark-green transition-colors hover:bg-brand-yellow',
        background
      )}
    >
      <ContentWidth className="grid h-full grid-cols-[190px_524px_573px] items-center gap-0">
        <div className="relative aspect-video h-auto w-[174px] shrink-0 justify-self-center overflow-hidden">
          <Image
            src={podcast.image}
            alt=""
            fill
            sizes="174px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex h-full min-w-0 flex-col justify-center gap-1.5 py-3 pl-3">
          <div className="text-mono-s flex items-center gap-2.5">
            <span>{podcast.date}</span>
            <Dot />
            <span>{episodeLabel(podcast)}</span>
          </div>
          <div className="flex w-[333px] max-w-full items-center gap-2.5">
            <PlayIcon />
            <h3 className="line-clamp-2 font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
              {podcast.title}
            </h3>
          </div>
        </div>
        <div className="hidden items-start gap-[132px] md:flex">
          <div className="w-[345px] py-3" />
          <div className="shrink-0 py-3">
            <UnderlineLabel>{listenOnApp}</UnderlineLabel>
          </div>
        </div>
      </ContentWidth>
    </ExternalLink>
  )
}

function PastEpisodes({
  podcasts,
  copy,
}: {
  podcasts: PressPodcastRow[]
  copy: BroadcastNetworkCopy
}) {
  return (
    <section className="bg-accent-tan text-brand-dark-green">
      <ContentWidth className="pb-3">
        <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em]">
          {copy.pastEpisodes}
        </h2>
      </ContentWidth>
      {podcasts.slice(0, 4).map((podcast, index) => (
        <EpisodeRow
          key={podcast.href}
          podcast={podcast}
          index={index}
          listenOnApp={copy.listenOnApp}
        />
      ))}
    </section>
  )
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
