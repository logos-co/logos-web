import type { BroadcastEventRow } from '@/lib/blog-engine'

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
export const MONTHS = [
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

const MIN_QUERY_YEAR = 1900
const MAX_QUERY_YEAR = 2100

export interface CalendarMonth {
  year: number
  /** Zero-based, like `Date#getMonth`. */
  month: number
}

export interface CalendarAnchor extends CalendarMonth {
  dayKey: string
}

export interface CalendarDay {
  dayNumber: string
  key: string
  isCurrentMonth: boolean
  events: BroadcastEventRow[]
}

export type DayKeyResolver = (event: BroadcastEventRow) => string

export function formatCalendarKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseCalendarKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month: month - 1, day }
}

export function compareEvents(a: BroadcastEventRow, b: BroadcastEventRow) {
  if (a.localTimestamp !== b.localTimestamp) {
    return a.localTimestamp - b.localTimestamp
  }

  const minutesA = a.timeMinutes ?? Number.MAX_SAFE_INTEGER
  const minutesB = b.timeMinutes ?? Number.MAX_SAFE_INTEGER
  if (minutesA !== minutesB) return minutesA - minutesB

  return a.id - b.id
}

/**
 * Pick the calendar's opening position. Events arrive sorted ascending by
 * timestamp, so the first event on or after today is the nearest upcoming one.
 * When every event is in the past (no upcoming shows scheduled yet) we fall
 * back to the most recent event so the calendar never opens on an empty month.
 *
 * Year and month come from the day key rather than the timestamp so the anchor
 * always agrees with the cell the event is drawn in.
 */
export function getInitialAnchor(
  events: BroadcastEventRow[],
  now: Date,
  getDayKey: DayKeyResolver
): CalendarAnchor {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()

  const anchorEvent =
    events.find((event) => event.localTimestamp >= startOfToday) ??
    events[events.length - 1]

  const dayKey = anchorEvent ? getDayKey(anchorEvent) : formatCalendarKey(now)
  const { year, month } = parseCalendarKey(dayKey)
  return { year, month, dayKey }
}

function groupEventsByDay(
  events: BroadcastEventRow[],
  getDayKey: DayKeyResolver
) {
  const eventsByDate = new Map<string, BroadcastEventRow[]>()
  const seenTitles = new Map<string, Set<string>>()

  for (const event of events) {
    const key = getDayKey(event)
    const dayEvents = eventsByDate.get(key) ?? []
    const titlesForDate = seenTitles.get(key) ?? new Set()
    if (titlesForDate.has(event.calendarTitle)) continue

    titlesForDate.add(event.calendarTitle)
    eventsByDate.set(key, [...dayEvents, event])
    seenTitles.set(key, titlesForDate)
  }

  return new Map(
    [...eventsByDate].map(([key, dayEvents]) => [
      key,
      [...dayEvents].sort(compareEvents),
    ])
  )
}

export function buildCalendarDays(
  events: BroadcastEventRow[],
  { year, month }: CalendarMonth,
  getDayKey: DayKeyResolver
): CalendarDay[] {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const startOffset = (monthStart.getDay() + 6) % 7
  const endOffset = 6 - ((monthEnd.getDay() + 6) % 7)
  const totalDays = startOffset + monthEnd.getDate() + endOffset
  const eventsByDate = groupEventsByDay(events, getDayKey)

  return Array.from({ length: totalDays }, (_, index): CalendarDay => {
    const date = new Date(year, month, 1 - startOffset + index)
    const key = formatCalendarKey(date)

    return {
      key,
      dayNumber: String(date.getDate()).padStart(2, '0'),
      isCurrentMonth: date.getMonth() === month,
      events: eventsByDate.get(key) ?? [],
    }
  })
}

/**
 * Choose which day a month should open on. Prefer the caller's hint (the
 * initial anchor or a tapped day), otherwise the first day with events, and
 * finally the first day of the month.
 */
export function pickSelectedKey(days: CalendarDay[], preferredKey?: string) {
  const monthDays = days.filter((day) => day.isCurrentMonth)
  if (preferredKey && monthDays.some((day) => day.key === preferredKey)) {
    return preferredKey
  }

  const firstWithEvents = monthDays.find((day) => day.events.length > 0)
  return firstWithEvents?.key ?? monthDays[0]?.key ?? null
}

export function getCalendarYears(
  events: BroadcastEventRow[],
  now: Date,
  getDayKey: DayKeyResolver
) {
  const currentYear = now.getFullYear()
  const years = new Set([currentYear - 1, currentYear, currentYear + 1])

  for (const event of events) {
    years.add(parseCalendarKey(getDayKey(event)).year)
  }

  return [...years].sort((a, b) => a - b)
}

/** Reads `?year=2026&month=10` (one-based month) into a calendar month. */
export function parseMonthQuery(search: string): CalendarMonth | null {
  const params = new URLSearchParams(search)
  const year = Number(params.get('year'))
  const month = Number(params.get('month'))

  if (!Number.isInteger(year) || !Number.isInteger(month)) return null
  if (year < MIN_QUERY_YEAR || year > MAX_QUERY_YEAR) return null
  if (month < 1 || month > 12) return null

  return { year, month: month - 1 }
}

/** `UTC+9`, `UTC-7`, `UTC+5:30` for the viewer's offset on `date`. */
export function formatUtcOffsetLabel(date: Date) {
  const totalMinutes = -date.getTimezoneOffset()
  const sign = totalMinutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(totalMinutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60

  if (minutes === 0) return `UTC${sign}${hours}`
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`
}

export function formatLocalTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
