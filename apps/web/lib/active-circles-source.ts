// Build-time source for the active-circles snapshot.
//
// This module performs the live API fetches and all derivation. It is invoked
// ONLY by `scripts/sync-active-circles.ts`, which writes the result to the
// committed snapshot JSON. Runtime pages never import this file — they read the
// snapshot via `active-circles.ts`.

import {
  ACTIVE_CIRCLES_DAYS,
  type ActiveCircleEvent,
  type ActiveCircleMarker,
  type ActiveCircleStat,
  type ActiveCircleUpcomingEvent,
  type ActiveCirclesSnapshot,
} from './active-circles-shared'
import { getLatestEventsByCity, type CircleEvent } from './circle-events'
import {
  BI_GRAPHQL_API_URL,
  CIRCLES_GRAPHQL_RESPONSE_KEY,
  LOGOS_GRAPHQL_API_URL,
} from './logos-data-api'
import { logger } from './logger'

type GraphqlResponse<TData> = {
  data?: TData
}

async function postGraphql<TData>(
  url: string,
  query: string
): Promise<TData | null> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`)
    }

    const payload = (await response.json()) as GraphqlResponse<TData>
    return payload.data ?? null
  } catch (error) {
    logger.error('Failed to fetch active circles data', { error })
    return null
  }
}

function isoDaysAgo(now: Date, days: number): string {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0] ?? ''
}

function getCirclesGraphqlQuery(dateString: string) {
  return `query CountDistinctCities {
  ${CIRCLES_GRAPHQL_RESPONSE_KEY}(where: { end_at: { _gte: "${dateString}" } }) {
    aggregate {
      count(distinct: true, columns: location_city)
    }
  }
}`
}

async function fetchDistinctActiveCityCount(
  activeSinceDate: string
): Promise<number | null> {
  type ResponseData = {
    [CIRCLES_GRAPHQL_RESPONSE_KEY]?: {
      aggregate?: {
        count?: number
      }
    }
  }

  const data = await postGraphql<ResponseData>(
    BI_GRAPHQL_API_URL,
    getCirclesGraphqlQuery(activeSinceDate)
  )

  return data?.[CIRCLES_GRAPHQL_RESPONSE_KEY]?.aggregate?.count ?? null
}

async function fetchCircleEvents(): Promise<ActiveCircleEvent[]> {
  type ResponseData = {
    stg_external_circle_circle_event?: ActiveCircleEvent[]
  }

  const query = `query CircleEvents {
  stg_external_circle_circle_event {
    event_id
    event_name
    event_url
    geo_latitude
    geo_longitude
    location_city
    location_country
    end_at
    start_at
  }
}`

  const data = await postGraphql<ResponseData>(LOGOS_GRAPHQL_API_URL, query)
  const events = data?.stg_external_circle_circle_event ?? []

  return [...events].sort((a, b) => {
    return new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  })
}

function getEventsSince(
  events: ActiveCircleEvent[],
  activeSinceDate: string
): ActiveCircleEvent[] {
  const activeSince = Date.parse(activeSinceDate)

  if (Number.isNaN(activeSince)) {
    return events
  }

  return events.filter((event) => {
    const eventDate = Date.parse(event.end_at ?? event.start_at ?? '')
    return !Number.isNaN(eventDate) && eventDate >= activeSince
  })
}

function toActiveCircleMarker(
  event: ActiveCircleEvent
): ActiveCircleMarker | null {
  const city = event.location_city?.trim()
  const country = event.location_country?.trim()
  if (!city || !country) return null

  const lat = Number(event.geo_latitude)
  const lng = Number(event.geo_longitude)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null

  return {
    id: event.event_id,
    name: event.event_name,
    city,
    country,
    lat,
    lng,
    eventUrl: event.event_url?.trim() || null,
  }
}

function byCityCountry(a: ActiveCircleMarker, b: ActiveCircleMarker): number {
  return `${a.city}, ${a.country}`.localeCompare(`${b.city}, ${b.country}`)
}

function startOfUtcDayMs(now: Date): number {
  const date = new Date(now)
  date.setUTCHours(0, 0, 0, 0)
  return date.getTime()
}

// The events API returns timezone-naive timestamps (e.g. "2026-06-06T11:00:00").
// Parsing those with `new Date(...)` would use the runtime's local zone, making
// the result depend on the build machine. Pin naive timestamps to UTC so the
// wall-clock is interpreted deterministically everywhere.
function parseEventInstantMs(iso: string): number {
  const hasZone = /([zZ])|([+-]\d{2}:?\d{2})$/.test(iso)
  return Date.parse(hasZone ? iso : `${iso}Z`)
}

function toUpcomingEvent(event: ActiveCircleEvent): ActiveCircleUpcomingEvent {
  return {
    id: event.event_id,
    name: event.event_name,
    city: event.location_city?.trim() ?? '',
    country: event.location_country?.trim() ?? '',
    startAt: event.start_at,
    endAt: event.end_at ?? null,
    eventUrl: event.event_url?.trim() || null,
  }
}

/** Events whose start date is today (UTC) or later, sorted soonest-first. */
function getUpcomingEvents(
  events: ActiveCircleEvent[],
  now: Date
): ActiveCircleUpcomingEvent[] {
  const startOfToday = startOfUtcDayMs(now)

  return events
    .filter((event) => {
      const start = parseEventInstantMs(event.start_at ?? '')
      return !Number.isNaN(start) && start >= startOfToday
    })
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .map(toUpcomingEvent)
}

/**
 * Fetches live data and derives the full active-circles snapshot. The `circles`
 * array (deduped, one per active city) is the single source consumed by both
 * the `/circles` map and the `/active-circles` list at runtime.
 */
export async function buildActiveCirclesSnapshot(
  now: Date
): Promise<ActiveCirclesSnapshot> {
  const activeSinceDate = isoDaysAgo(now, ACTIVE_CIRCLES_DAYS)
  const [distinctActiveCities, events] = await Promise.all([
    fetchDistinctActiveCityCount(activeSinceDate),
    fetchCircleEvents(),
  ])

  const activeEvents = getEventsSince(events, activeSinceDate)
  const circles = getLatestEventsByCity(activeEvents as CircleEvent[])
    .map(toActiveCircleMarker)
    .filter((marker): marker is ActiveCircleMarker => marker !== null)
    .sort(byCityCountry)

  const upcomingEvents = getUpcomingEvents(events, now)

  const distinctCountries = new Set(
    events.map((event) => event.location_country?.trim()).filter(Boolean)
  ).size

  const stats: ActiveCircleStat[] = [
    { label: 'Total Circle Events', value: events.length },
    { label: 'Distinct Cities', value: distinctActiveCities },
    { label: 'Distinct Countries', value: distinctCountries },
    { label: 'Upcoming Events', value: upcomingEvents.length },
  ]

  return {
    generatedAt: now.toISOString(),
    activeSinceDate,
    circles,
    upcomingEvents,
    stats,
  }
}
