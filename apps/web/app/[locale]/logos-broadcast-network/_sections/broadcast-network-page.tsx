'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

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
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getInitialCalendarDate(events: BroadcastEventRow[]) {
  const today = new Date()
  const firstEventDate = events[0]
    ? new Date(`${events[0].date}T00:00:00.000Z`)
    : today

  return {
    year: firstEventDate.getUTCFullYear(),
    month: firstEventDate.getUTCMonth(),
  }
}

function buildCalendarDays(
  events: BroadcastEventRow[],
  year: number,
  month: number
) {
  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd = new Date(Date.UTC(year, month + 1, 0))
  const startOffset = (monthStart.getUTCDay() + 6) % 7
  const endOffset = 6 - ((monthEnd.getUTCDay() + 6) % 7)
  const calendarStart = new Date(monthStart)
  calendarStart.setUTCDate(monthStart.getUTCDate() - startOffset)
  const totalDays = startOffset + monthEnd.getUTCDate() + endOffset
  const eventsByDate = new Map<string, BroadcastEventRow[]>()

  for (const event of events) {
    const dayEvents = eventsByDate.get(event.date) ?? []
    dayEvents.push(event)
    eventsByDate.set(event.date, dayEvents)
  }

  const days = Array.from({ length: totalDays }, (_, index): CalendarDay => {
    const date = new Date(calendarStart)
    date.setUTCDate(calendarStart.getUTCDate() + index)
    const key = formatCalendarKey(date)

    return {
      key,
      dayNumber: String(date.getUTCDate()).padStart(2, '0'),
      isCurrentMonth: date.getUTCMonth() === month,
      events: eventsByDate.get(key) ?? [],
    }
  })

  return { days }
}

function getCalendarYears(events: BroadcastEventRow[]) {
  const currentYear = new Date().getFullYear()
  const years = new Set([currentYear - 1, currentYear, currentYear + 1])

  for (const event of events) {
    years.add(new Date(`${event.date}T00:00:00.000Z`).getUTCFullYear())
  }

  return [...years].sort((a, b) => a - b)
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
    <section className="bg-accent-tan px-3 pb-[100px] pt-16 text-brand-dark-green md:pt-6">
      <div className="mx-auto flex w-full max-w-[1416px] flex-col gap-10">
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
      </div>
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
  return (
    <ExternalLink
      href={event.link}
      className="flex min-w-0 cursor-pointer items-center gap-3 rounded-3xl bg-brand-off-white/50 py-1.5 pl-1.5 pr-6 text-brand-dark-green transition-colors hover:bg-brand-yellow"
    >
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
    </ExternalLink>
  )
}

function EventCards({
  events,
  copy,
}: {
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}) {
  return (
    <section className="bg-accent-tan px-3 pb-10">
      <div className="grid grid-cols-3 gap-3">
        {events.slice(0, 6).map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            copy={copy}
            image={FEATURE_IMAGES[index % FEATURE_IMAGES.length]}
          />
        ))}
      </div>
    </section>
  )
}

function CalendarCell({ day }: { day: CalendarDay }) {
  const event = day.events[0]

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
      {event ? (
        <ExternalLink
          href={event.link}
          className="block cursor-pointer rounded-lg border border-brand-dark-green/50 p-2 font-mono text-[10px] font-medium uppercase leading-[1.3] transition-colors group-hover:bg-[#c7f3ff]"
        >
          <span className="line-clamp-2">{event.title}</span>
        </ExternalLink>
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
  const initialDate = useMemo(() => getInitialCalendarDate(events), [events])
  const [calendarDate, setCalendarDate] = useState(initialDate)
  const years = useMemo(() => getCalendarYears(events), [events])
  const { days } = buildCalendarDays(
    events,
    calendarDate.year,
    calendarDate.month
  )

  const goToMonth = (offset: number) => {
    const next = new Date(
      Date.UTC(calendarDate.year, calendarDate.month + offset, 1)
    )
    setCalendarDate({
      year: next.getUTCFullYear(),
      month: next.getUTCMonth(),
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
    <section className="overflow-x-auto bg-accent-tan pb-[100px] text-brand-dark-green">
      <div className="mx-auto w-[1440px]">
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
      </div>
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
        'group relative block h-[131px] cursor-pointer overflow-hidden text-brand-dark-green transition-colors hover:bg-brand-yellow',
        background
      )}
    >
      <div className="absolute left-3 top-3 size-[107px] overflow-hidden">
        <Image
          src={podcast.image}
          alt=""
          fill
          sizes="107px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="absolute left-[119px] top-0 grid h-full w-[1150px] grid-cols-[595px_345px_1fr] gap-x-3">
        <div className="flex h-full flex-col justify-between py-3 pl-3">
          <div className="text-mono-s flex items-center gap-2.5">
            <span>{podcast.date}</span>
            <Dot />
            <span>{episodeLabel(podcast)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <PlayIcon />
            <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
              {podcast.title}
            </h3>
          </div>
        </div>
        <p className="text-mono-s line-clamp-4 py-3">{podcast.description}</p>
        <div className="py-3">
          <UnderlineLabel>{listenOnApp}</UnderlineLabel>
        </div>
      </div>
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
      <div className="px-3 pb-3">
        <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em]">
          {copy.pastEpisodes}
        </h2>
      </div>
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
