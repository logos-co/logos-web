import { getLatestEventsByCity } from './circle-events'
import {
  BI_GRAPHQL_API_URL,
  CIRCLES_GRAPHQL_RESPONSE_KEY,
  LOGOS_GRAPHQL_API_URL,
} from './logos-data-api'
import { logger } from './logger'

export const ACTIVE_CIRCLES_DAYS = 120

type GraphqlResponse<TData> = {
  data?: TData
}

export type ActiveCircleEvent = {
  event_id: string
  event_name: string
  event_url?: string | null
  geo_latitude: string | number
  geo_longitude: string | number
  location_city?: string | null
  location_country?: string | null
  end_at?: string | null
  start_at: string
}

export type ActiveCircleLocation = {
  label: string
  href: string | null
}

export type ActiveCircleMarker = {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  eventUrl: string | null
}

export type ActiveCircleStat = {
  label: string
  value: number | null
}

export type ActiveCirclesOverview = {
  activeSinceDate: string
  activeLocations: ActiveCircleLocation[]
  stats: ActiveCircleStat[]
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
      cache: 'force-cache',
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

function getTodayISODateDaysAgo(days: number): string {
  const date = new Date()
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

function getActiveLocations(
  events: ActiveCircleEvent[]
): ActiveCircleLocation[] {
  return getLatestEventsByCity(events)
    .map((event) => {
      const city = event.location_city?.trim()
      const country = event.location_country?.trim()

      return {
        label: `${city}, ${country}`,
        href: event.event_url?.trim() || null,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
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

/**
 * Map markers for the active circles, drawn from the same live source and the
 * same filter/dedup pipeline as the `/active-circles` location list, so the
 * `/circles` map always mirrors that page (one marker per distinct active city,
 * within the last {@link ACTIVE_CIRCLES_DAYS} days).
 */
export async function getActiveCircleMarkers(): Promise<ActiveCircleMarker[]> {
  const activeSinceDate = getTodayISODateDaysAgo(ACTIVE_CIRCLES_DAYS)
  const events = await fetchCircleEvents()
  const activeEvents = getEventsSince(events, activeSinceDate)

  return getLatestEventsByCity(activeEvents)
    .map(toActiveCircleMarker)
    .filter((marker): marker is ActiveCircleMarker => marker !== null)
    .sort((a, b) =>
      `${a.city}, ${a.country}`.localeCompare(`${b.city}, ${b.country}`)
    )
}

function getUpcomingEventsCount(events: ActiveCircleEvent[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return events.filter((event) => {
    if (!event.start_at) return false

    const eventDate = new Date(event.start_at)
    eventDate.setHours(0, 0, 0, 0)

    return eventDate >= today
  }).length
}

export async function getActiveCirclesOverview(): Promise<ActiveCirclesOverview> {
  const activeSinceDate = getTodayISODateDaysAgo(ACTIVE_CIRCLES_DAYS)
  const [distinctActiveCities, events] = await Promise.all([
    fetchDistinctActiveCityCount(activeSinceDate),
    fetchCircleEvents(),
  ])

  const activeEvents = getEventsSince(events, activeSinceDate)
  const activeLocations = getActiveLocations(activeEvents)
  const distinctCountries = new Set(
    events.map((event) => event.location_country?.trim()).filter(Boolean)
  ).size

  return {
    activeSinceDate,
    activeLocations,
    stats: [
      { label: 'Total Circle Events', value: events.length },
      { label: 'Distinct Cities', value: distinctActiveCities },
      { label: 'Distinct Countries', value: distinctCountries },
      { label: 'Upcoming Events', value: getUpcomingEventsCount(events) },
    ],
  }
}
