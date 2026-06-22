'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import ContentWidth from '@/components/layout/content-width'
import { ExternalLink } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { BroadcastEventRow } from '@/lib/blog-engine'

import { compareEvents } from './atoms'
import type { BroadcastNetworkCopy } from './types'

interface CalendarDay {
  dayNumber: string
  key: string
  isCurrentMonth: boolean
  events: BroadcastEventRow[]
}

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

function formatCalendarKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface CalendarAnchor {
  year: number
  month: number
  dayKey: string
}

/**
 * Pick the calendar's opening position. Events arrive sorted ascending by
 * timestamp, so the first event on or after today is the nearest upcoming one.
 * When every event is in the past (no upcoming shows scheduled yet) we fall
 * back to the most recent event so the calendar never opens on an empty month.
 */
function getInitialAnchor(events: BroadcastEventRow[]): CalendarAnchor {
  const today = new Date()
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime()

  const anchorEvent =
    events.find((event) => event.localTimestamp >= startOfToday) ??
    events[events.length - 1]

  if (!anchorEvent) {
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      dayKey: formatCalendarKey(today),
    }
  }

  const anchorDate = new Date(anchorEvent.localTimestamp)
  return {
    year: anchorDate.getFullYear(),
    month: anchorDate.getMonth(),
    dayKey: anchorEvent.localDateKey,
  }
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

/**
 * Choose which day a month should open on. Prefer the caller's hint (the
 * initial anchor or a tapped day), otherwise the first day with events, and
 * finally the first day of the month.
 */
function pickSelectedKey(days: CalendarDay[], preferredKey?: string) {
  const monthDays = days.filter((day) => day.isCurrentMonth)
  if (preferredKey && monthDays.some((day) => day.key === preferredKey)) {
    return preferredKey
  }

  const firstWithEvents = monthDays.find((day) => day.events.length > 0)
  return firstWithEvents?.key ?? monthDays[0]?.key ?? null
}

function getCalendarYears(events: BroadcastEventRow[]) {
  const currentYear = new Date().getFullYear()
  const years = new Set([currentYear - 1, currentYear, currentYear + 1])

  for (const event of events) {
    years.add(new Date(event.localTimestamp).getFullYear())
  }

  return [...years].sort((a, b) => a - b)
}

function EventPill({
  event,
  interactive = true,
}: {
  event: BroadcastEventRow
  interactive?: boolean
}) {
  const baseClassName =
    'block rounded-lg border border-brand-dark-green/50 p-2 font-mono text-[10px] font-medium uppercase leading-[1.3]'
  const content = <span className="line-clamp-2">{event.calendarTitle}</span>

  return interactive && event.link ? (
    <ExternalLink
      href={event.link}
      className={cn(
        baseClassName,
        'cursor-pointer transition-colors group-hover:bg-[#c7f3ff]'
      )}
    >
      {content}
    </ExternalLink>
  ) : (
    <div className={baseClassName}>{content}</div>
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
          {day.events.map((event) => (
            <EventPill key={event.id} event={event} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function MonthSelect({
  value,
  label,
  onChange,
  className,
}: {
  value: number
  label: string
  onChange: (month: number) => void
  className?: string
}) {
  return (
    <label className={cn('relative block h-[31px] w-[141px]', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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
  )
}

function YearSelect({
  value,
  years,
  label,
  onChange,
  className,
}: {
  value: number
  years: number[]
  label: string
  onChange: (year: number) => void
  className?: string
}) {
  return (
    <label className={cn('relative block h-[31px] w-[131px]', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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
  )
}

function NavButtons({
  onPrevious,
  onToday,
  onNext,
  todayLabel,
  className,
}: {
  onPrevious: () => void
  onToday: () => void
  onNext: () => void
  todayLabel: string
  className?: string
}) {
  return (
    <div className={cn('flex h-[31px] items-center gap-1', className)}>
      <button
        type="button"
        aria-label="Previous month"
        onClick={onPrevious}
        className="flex h-[31px] w-[39px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[16px] leading-none"
      >
        ←
      </button>
      <button
        type="button"
        onClick={onToday}
        className="flex h-[31px] w-[54px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[10px] font-semibold uppercase leading-[1.35]"
      >
        {todayLabel}
      </button>
      <button
        type="button"
        aria-label="Next month"
        onClick={onNext}
        className="flex h-[31px] w-[39px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[16px] leading-none"
      >
        →
      </button>
    </div>
  )
}

function MobileDayCarousel({
  days,
  selectedKey,
  onSelect,
}: {
  days: CalendarDay[]
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  const selectedRef = useRef<HTMLDivElement>(null)
  const monthDays = days.filter((day) => day.isCurrentMonth)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [selectedKey])

  return (
    <div
      className="-mx-3 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Spacers let the first and last day center within the viewport. */}
      <div aria-hidden className="w-[calc(50%-136px)] shrink-0" />
      {monthDays.map((day) => {
        if (day.key === selectedKey) {
          return (
            <div
              key={day.key}
              ref={selectedRef}
              className="flex min-h-[301px] w-[273px] shrink-0 snap-center flex-col justify-between rounded-xl bg-accent-light-blue p-2 text-brand-dark-green"
            >
              <div className="flex w-full items-center justify-center p-1">
                <span className="flex-1 font-sans text-[14px] leading-[1.2]">
                  {day.dayNumber}
                </span>
              </div>
              {day.events.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {day.events.map((event) => (
                    <EventPill key={event.id} event={event} />
                  ))}
                </div>
              ) : null}
            </div>
          )
        }

        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect(day.key)}
            className="flex h-[301px] w-[192px] shrink-0 snap-center flex-col justify-between rounded-xl border border-brand-dark-green/50 p-2 text-left text-brand-dark-green transition-colors hover:bg-[#c7f3ff]"
          >
            <div className="flex w-full items-center justify-center p-1">
              <span className="flex-1 font-sans text-[14px] leading-[1.2]">
                {day.dayNumber}
              </span>
            </div>
            {day.events.length > 0 ? (
              <div className="flex w-full flex-col gap-1">
                {day.events.map((event) => (
                  <EventPill key={event.id} event={event} interactive={false} />
                ))}
              </div>
            ) : null}
          </button>
        )
      })}
      <div aria-hidden className="w-[calc(50%-136px)] shrink-0" />
    </div>
  )
}

export function EventsCalendar({
  events,
  copy,
}: {
  events: BroadcastEventRow[]
  copy: BroadcastNetworkCopy
}) {
  const initialAnchor = useMemo(() => getInitialAnchor(events), [events])
  const [calendarDate, setCalendarDate] = useState({
    year: initialAnchor.year,
    month: initialAnchor.month,
  })
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialAnchor.dayKey
  )
  const years = useMemo(() => getCalendarYears(events), [events])
  const { days } = buildCalendarDays(
    events,
    calendarDate.year,
    calendarDate.month
  )

  const applyMonth = (year: number, month: number, preferredKey?: string) => {
    setCalendarDate({ year, month })
    const { days: nextDays } = buildCalendarDays(events, year, month)
    setSelectedKey(pickSelectedKey(nextDays, preferredKey))
  }

  const goToMonth = (offset: number) => {
    const next = new Date(calendarDate.year, calendarDate.month + offset, 1)
    applyMonth(next.getFullYear(), next.getMonth())
  }

  const goToToday = () => {
    const today = new Date()
    applyMonth(today.getFullYear(), today.getMonth(), formatCalendarKey(today))
  }

  return (
    <section className="bg-accent-tan pt-16 pb-25 text-brand-dark-green">
      <ContentWidth>
        {/* Mobile: horizontal day carousel centered on the nearest event. */}
        <div className="md:hidden">
          <h2 className="px-3 font-sans text-[36px] leading-none tracking-[-0.02em]">
            {copy.upcomingEvents}
          </h2>
          <MobileDayCarousel
            days={days}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
            <div className="flex shrink-0 items-center gap-2">
              <MonthSelect
                value={calendarDate.month}
                label={copy.calendarMonthLabel}
                onChange={(month) => applyMonth(calendarDate.year, month)}
                className="w-[120px]"
              />
              <YearSelect
                value={calendarDate.year}
                years={years}
                label={copy.calendarYearLabel}
                onChange={(year) => applyMonth(year, calendarDate.month)}
                className="w-[96px]"
              />
            </div>
            <NavButtons
              onPrevious={() => goToMonth(-1)}
              onToday={goToToday}
              onNext={() => goToMonth(1)}
              todayLabel={copy.calendarTodayLabel}
              className="shrink-0"
            />
          </div>
        </div>

        {/* Desktop: full month grid. */}
        <div className="hidden md:block">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-3 pb-6 pt-25">
            <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em]">
              {copy.upcomingEvents}
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              <div
                className="flex items-center gap-2"
                aria-label={`${copy.calendarMonthLabel} and ${copy.calendarYearLabel}`}
              >
                <MonthSelect
                  value={calendarDate.month}
                  label={copy.calendarMonthLabel}
                  onChange={(month) => applyMonth(calendarDate.year, month)}
                />
                <YearSelect
                  value={calendarDate.year}
                  years={years}
                  label={copy.calendarYearLabel}
                  onChange={(year) => applyMonth(year, calendarDate.month)}
                />
              </div>
              <NavButtons
                onPrevious={() => goToMonth(-1)}
                onToday={goToToday}
                onNext={() => goToMonth(1)}
                todayLabel={copy.calendarTodayLabel}
              />
            </div>
          </div>
          <div
            className="-mx-3 overflow-x-auto px-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="w-[1416px]">
              <div className="grid h-[29px] grid-cols-[repeat(7,192px)] gap-3">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="flex items-center justify-center font-mono text-[10px] font-semibold uppercase leading-[1.35]"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-[repeat(7,192px)] gap-3 pt-3">
                {days.map((day) => (
                  <CalendarCell key={day.key} day={day} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
