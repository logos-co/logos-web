'use client'

import { useMemo, useState } from 'react'

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

function getInitialCalendarDate() {
  const today = new Date()

  return {
    year: today.getFullYear(),
    month: today.getMonth(),
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

function getCalendarYears(events: BroadcastEventRow[]) {
  const currentYear = new Date().getFullYear()
  const years = new Set([currentYear - 1, currentYear, currentYear + 1])

  for (const event of events) {
    years.add(new Date(event.localTimestamp).getFullYear())
  }

  return [...years].sort((a, b) => a - b)
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

export function EventsCalendar({
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
    <section className="bg-accent-tan pt-25 pb-25 text-brand-dark-green">
      <ContentWidth>
        <div className="relative h-[160px] px-3">
          <h2 className="absolute bottom-6 left-3 font-sans text-[36px] leading-none tracking-[-0.02em]">
            {copy.upcomingEvents}
          </h2>
          <div
            className="absolute top-6 left-3 flex h-[31px] items-center gap-2 md:bottom-6 md:left-[726px] md:top-auto"
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
      </ContentWidth>
    </section>
  )
}
