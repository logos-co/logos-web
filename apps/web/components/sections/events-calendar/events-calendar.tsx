'use client'

import { useMemo, useState } from 'react'

import ContentWidth from '@/components/layout/content-width'
import { cn } from '@/lib/cn'
import type { BroadcastEventRow } from '@/lib/blog-engine'
import { useIsHydrated } from '@/lib/use-is-hydrated'

import {
  WEEKDAYS,
  buildCalendarDays,
  formatCalendarKey,
  getCalendarYears,
  getInitialAnchor,
  parseMonthQuery,
  pickSelectedKey,
  type CalendarMonth,
  type DayKeyResolver,
} from './calendar-dates'
import { MonthSelect, NavButtons, YearSelect } from './calendar-controls'
import {
  CalendarCell,
  HIDDEN_SCROLLBAR_STYLE,
  MobileDayCarousel,
} from './calendar-days'
import { EventDetails } from './event-details'
import type { EventDetailsCopy, EventsCalendarCopy } from './types'

/** Before hydration: the day the build machine put the event on. */
const buildTimeDayKey: DayKeyResolver = (event) => event.localDateKey
/** After hydration: the day in the viewer's own timezone. */
const viewerDayKey: DayKeyResolver = (event) =>
  formatCalendarKey(new Date(event.localTimestamp))

function writeMonthToUrl({ year, month }: CalendarMonth) {
  const url = new URL(window.location.href)
  url.searchParams.set('year', String(year))
  url.searchParams.set('month', String(month + 1))
  window.history.replaceState(window.history.state, '', url)
}

interface EventsCalendarProps {
  events: BroadcastEventRow[]
  copy: EventsCalendarCopy
  /**
   * Build time in ms. Stands in for "now" until hydration so the static HTML
   * and the first client render agree.
   */
  referenceTime: number
  /** Enables day selection and a details panel for the selected day. */
  details?: EventDetailsCopy
  /** Mirror the visible month in `?year=&month=` and open on it when present. */
  syncMonthToUrl?: boolean
  /** Drop the section's own vertical padding when the page already spaces it. */
  compact?: boolean
}

export function EventsCalendar({
  events,
  copy,
  referenceTime,
  details,
  syncMonthToUrl = false,
  compact = false,
}: EventsCalendarProps) {
  const isHydrated = useIsHydrated()
  const getDayKey = isHydrated ? viewerDayKey : buildTimeDayKey
  const now = useMemo(
    () => (isHydrated ? new Date() : new Date(referenceTime)),
    [isHydrated, referenceTime]
  )
  const urlMonth = useMemo(
    () =>
      isHydrated && syncMonthToUrl
        ? parseMonthQuery(window.location.search)
        : null,
    [isHydrated, syncMonthToUrl]
  )
  const anchor = useMemo(
    () => getInitialAnchor(events, now, getDayKey),
    [events, now, getDayKey]
  )
  const years = useMemo(
    () => getCalendarYears(events, now, getDayKey),
    [events, now, getDayKey]
  )

  // `null` means "not chosen yet": follow the URL or the anchor.
  const [chosenMonth, setChosenMonth] = useState<CalendarMonth | null>(null)
  const [chosenKey, setChosenKey] = useState<string | null>(null)

  const calendarMonth = chosenMonth ?? urlMonth ?? anchor
  const days = buildCalendarDays(events, calendarMonth, getDayKey)
  const selectedKey =
    chosenKey ?? (urlMonth ? pickSelectedKey(days) : anchor.dayKey)
  const selectedEvents =
    days.find((day) => day.key === selectedKey)?.events ?? []

  const applyMonth = (next: CalendarMonth, preferredKey?: string) => {
    setChosenMonth(next)
    setChosenKey(
      pickSelectedKey(buildCalendarDays(events, next, getDayKey), preferredKey)
    )
    if (syncMonthToUrl) writeMonthToUrl(next)
  }

  const goToMonth = (offset: number) => {
    const next = new Date(calendarMonth.year, calendarMonth.month + offset, 1)
    applyMonth({ year: next.getFullYear(), month: next.getMonth() })
  }

  const goToToday = () => {
    const today = new Date()
    applyMonth(
      { year: today.getFullYear(), month: today.getMonth() },
      formatCalendarKey(today)
    )
  }

  const selectMonth = (month: number) =>
    applyMonth({ year: calendarMonth.year, month })
  const selectYear = (year: number) =>
    applyMonth({ year, month: calendarMonth.month })

  // The panel shows viewer-local times, so it waits for hydration.
  const detailsPanel =
    details && isHydrated && selectedKey ? (
      <EventDetails
        dayKey={selectedKey}
        events={selectedEvents}
        copy={details}
      />
    ) : null

  return (
    <section
      className={cn(
        'bg-accent-tan text-brand-dark-green',
        !compact && 'pt-16 pb-25'
      )}
    >
      <ContentWidth>
        {/* Mobile: horizontal day carousel centered on the nearest event. */}
        <div className="md:hidden">
          {copy.heading ? (
            <h2 className="px-3 font-sans text-[36px] leading-none tracking-[-0.02em]">
              {copy.heading}
            </h2>
          ) : null}
          <MobileDayCarousel
            days={days}
            selectedKey={selectedKey}
            onSelect={setChosenKey}
            hasDetailsPanel={Boolean(details)}
          />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
            <div className="flex shrink-0 items-center gap-2">
              <MonthSelect
                value={calendarMonth.month}
                label={copy.monthLabel}
                onChange={selectMonth}
                className="w-[120px]"
              />
              <YearSelect
                value={calendarMonth.year}
                years={years}
                label={copy.yearLabel}
                onChange={selectYear}
                className="w-[96px]"
              />
            </div>
            <NavButtons
              onPrevious={() => goToMonth(-1)}
              onToday={goToToday}
              onNext={() => goToMonth(1)}
              todayLabel={copy.todayLabel}
              className="shrink-0"
            />
          </div>
          {detailsPanel}
        </div>

        {/* Desktop: full month grid. */}
        <div className="hidden md:block">
          <div
            className={cn(
              'flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-3 pb-6',
              !compact && 'pt-25'
            )}
          >
            {copy.heading ? (
              <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em]">
                {copy.heading}
              </h2>
            ) : null}
            <div className="flex shrink-0 items-center gap-3">
              <div
                className="flex items-center gap-2"
                aria-label={`${copy.monthLabel} and ${copy.yearLabel}`}
              >
                <MonthSelect
                  value={calendarMonth.month}
                  label={copy.monthLabel}
                  onChange={selectMonth}
                />
                <YearSelect
                  value={calendarMonth.year}
                  years={years}
                  label={copy.yearLabel}
                  onChange={selectYear}
                />
              </div>
              <NavButtons
                onPrevious={() => goToMonth(-1)}
                onToday={goToToday}
                onNext={() => goToMonth(1)}
                todayLabel={copy.todayLabel}
              />
            </div>
          </div>
          <div
            className="-mx-3 overflow-x-auto px-3"
            style={HIDDEN_SCROLLBAR_STYLE}
          >
            <div className="w-[1416px]">
              <div className="grid h-[29px] grid-cols-[repeat(7,192px)] gap-3">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="flex items-center justify-center font-mono text-xs font-semibold uppercase leading-[1.35]"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-[repeat(7,192px)] gap-3 pt-3">
                {days.map((day) => (
                  <CalendarCell
                    key={day.key}
                    day={day}
                    isSelected={Boolean(details) && day.key === selectedKey}
                    onSelect={details ? setChosenKey : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
          {detailsPanel}
        </div>
      </ContentWidth>
    </section>
  )
}
