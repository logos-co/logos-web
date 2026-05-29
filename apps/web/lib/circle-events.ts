import { LOGOS_GRAPHQL_API_URL } from './logos-data-api'
import { logger } from './logger'

const CIRCLE_EVENTS_QUERY = `query CircleEvents {
  stg_external_circle_circle_event {
    event_id
    event_name
    event_url
    geo_latitude
    geo_longitude
    location_city
    location_country
    start_at
  }
}`

const CIRCLE_NAME_PATTERN = /circle/i

export interface CircleEvent {
  event_id: string
  event_name: string
  event_url?: string | null
  geo_latitude: string | number
  geo_longitude: string | number
  location_city?: string | null
  location_country?: string | null
  start_at: string
}

interface HasuraResponse {
  data?: {
    stg_external_circle_circle_event?: CircleEvent[]
  }
}

/**
 * Fetches circle events from Logos' Hasura endpoint at build time.
 * The site is statically exported (`output: 'export'`), so this runs once
 * per build. Returns an empty array on failure to keep the page renderable.
 */
export async function fetchCircleEvents(): Promise<CircleEvent[]> {
  try {
    const response = await fetch(LOGOS_GRAPHQL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CIRCLE_EVENTS_QUERY }),
    })

    if (!response.ok) {
      throw new Error(`Hasura request failed: ${response.status}`)
    }

    const payload = (await response.json()) as HasuraResponse
    const rows = payload.data?.stg_external_circle_circle_event ?? []

    return rows.filter((event) => {
      if (event.geo_latitude == null || event.geo_longitude == null)
        return false
      const lat = Number(event.geo_latitude)
      const lng = Number(event.geo_longitude)
      return !Number.isNaN(lat) && !Number.isNaN(lng)
    })
  } catch (error) {
    logger.error('Failed to fetch circle events from Hasura', { error })
    return []
  }
}

/**
 * Collapses multiple events in the same city to the single most recent one.
 * Latest is chosen by `start_at`; events with unparseable dates lose to any
 * parseable competitor.
 */
export function getLatestEventsByCity(events: CircleEvent[]): CircleEvent[] {
  const latestByCity = new Map<string, CircleEvent>()

  for (const event of events) {
    const city = event.location_city?.trim()
    const country = event.location_country?.trim()
    if (!city || !country) continue

    const key = `${country.toLowerCase()}-${city.toLowerCase()}`
    const previous = latestByCity.get(key)

    if (!previous) {
      latestByCity.set(key, event)
      continue
    }

    const currentStartAt = Date.parse(event.start_at ?? '')
    const previousStartAt = Date.parse(previous.start_at ?? '')

    if (
      Number.isNaN(previousStartAt) ||
      (!Number.isNaN(currentStartAt) && currentStartAt > previousStartAt)
    ) {
      latestByCity.set(key, event)
    }
  }

  return Array.from(latestByCity.values())
}

export function isCircleEvent(event: CircleEvent): boolean {
  return CIRCLE_NAME_PATTERN.test(event.event_name ?? '')
}
