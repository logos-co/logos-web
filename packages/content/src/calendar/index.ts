import { calendarResponseSchema, type CalendarEvent } from './schema'
import type { BroadcastEventRow } from './types'

export type { BroadcastEventRow } from './types'

const formatEventDateLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00.000Z`))

const getDateParts = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

const getTimeParts = (
  time?: string | null
): { hours: number; minutes: number } | null => {
  const trimmedTime = time?.trim()
  if (!trimmedTime) return null

  const twentyFourHourMatch = /^(\d{1,2}):(\d{2})$/.exec(trimmedTime)
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1])
    const minutes = Number(twentyFourHourMatch[2])
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes }
    }
  }

  const twelveHourMatch = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(trimmedTime)
  if (twelveHourMatch) {
    const rawHours = Number(twelveHourMatch[1])
    const minutes = Number(twelveHourMatch[2])
    const period = twelveHourMatch[3].toLowerCase()
    if (rawHours >= 1 && rawHours <= 12 && minutes >= 0 && minutes <= 59) {
      const hours =
        period === 'pm' ? (rawHours % 12) + 12 : rawHours === 12 ? 0 : rawHours
      return { hours, minutes }
    }
  }

  return null
}

const getEventLocalDateTime = (event: CalendarEvent) => {
  const dateParts = getDateParts(event.date)
  if (!dateParts) return null

  const timeParts = getTimeParts(event.time)
  const hours = timeParts?.hours ?? 0
  const minutes = timeParts?.minutes ?? 0

  return new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hours, minutes)
  )
}

const getEventTimeMinutesSinceMidnight = (time?: string | null) => {
  const timeParts = getTimeParts(time)
  if (!timeParts) return null

  return timeParts.hours * 60 + timeParts.minutes
}

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isMeaningful = (value?: string | null) => {
  if (!value) return false
  return value.trim().length > 0 && value.trim().toLowerCase() !== 'null'
}

const meaningfulText = (value?: string | null) =>
  isMeaningful(value) ? value!.trim() : ''

const getEventLinks = (links?: string[]) =>
  links?.map(meaningfulText).filter(Boolean) ?? []

const toBroadcastEventRow = (event: CalendarEvent): BroadcastEventRow => {
  const typeLabel = event.type.label
  const topic = meaningfulText(event.topic)
  const calendarTitle = topic || typeLabel || 'Event'
  const guest = meaningfulText(event.guest)
  const speakers = event.speakers.map(meaningfulText).filter(Boolean)
  const host = speakers.join(', ') || guest || 'Logos Network'
  const detailParts = [topic, guest].filter(Boolean)
  const localDateTime =
    getEventLocalDateTime(event) ?? new Date(`${event.date}T00:00:00.000Z`)
  const links = getEventLinks(event.links)

  return {
    id: event.id,
    title: typeLabel || calendarTitle,
    calendarTitle,
    description:
      detailParts.join(' featuring ') ||
      'Live streams, updates, and regular programming from the Logos network.',
    host,
    date: event.date,
    time: event.time ?? undefined,
    dateLabel: formatEventDateLabel(event.date),
    localDateKey: formatLocalDateKey(localDateTime),
    localTimestamp: localDateTime.getTime(),
    timeMinutes: getEventTimeMinutesSinceMidnight(event.time),
    typeLabel: meaningfulText(typeLabel),
    topic,
    guest,
    speakers,
    notes: meaningfulText(event.notes),
    links,
    link: links[0],
  }
}

export function parseBroadcastEvents(payload: unknown): BroadcastEventRow[] {
  const { data } = calendarResponseSchema.parse(payload)
  const uniqueEvents = Array.from(
    new Map(data.map((event) => [event.id, event])).values()
  )

  return uniqueEvents.map(toBroadcastEventRow).sort((a, b) => {
    if (a.localTimestamp !== b.localTimestamp) {
      return a.localTimestamp - b.localTimestamp
    }

    const minutesA = a.timeMinutes ?? Number.MAX_SAFE_INTEGER
    const minutesB = b.timeMinutes ?? Number.MAX_SAFE_INTEGER
    if (minutesA !== minutesB) return minutesA - minutesB

    return a.id - b.id
  })
}
