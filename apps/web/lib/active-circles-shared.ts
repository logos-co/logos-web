// Shared types and constants for the active-circles dataset.
//
// This module performs NO I/O and imports NO generated snapshot, so it is safe
// to import from both the runtime reader (`active-circles.ts`) and the
// build-time source (`active-circles-source.ts`) without creating a cycle with
// the generated snapshot JSON.

/** Window, in days, that defines an "active" circle (measured from build time). */
export const ACTIVE_CIRCLES_DAYS = 120

/** Number of upcoming events surfaced in the `/circles` "Upcoming Events" list. */
export const UPCOMING_CIRCLE_EVENTS_LIMIT = 3

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

/**
 * An upcoming circle event (start date is today or later), sourced live. The
 * warehouse API exposes no host, image, region, or timezone, so the UI renders a
 * leaner card and shows times in UTC. The cover image is enriched separately at
 * sync time by scraping the event's Luma page (see `active-circles-source.ts`).
 */
export type ActiveCircleUpcomingEvent = {
  id: string
  name: string
  city: string
  country: string
  /** ISO-8601 UTC start timestamp. */
  startAt: string
  /** ISO-8601 UTC end timestamp, when known. */
  endAt: string | null
  eventUrl: string | null
  /** Resized Luma cover image URL, when resolvable; null falls back to a default. */
  coverUrl: string | null
}

export type ActiveCirclesOverview = {
  activeSinceDate: string
  activeLocations: ActiveCircleLocation[]
  stats: ActiveCircleStat[]
}

/**
 * The committed, build-time snapshot of active circles. `circles` is the single
 * source of truth shared by the `/circles` map and the `/active-circles` list,
 * guaranteeing the two can never diverge.
 */
export type ActiveCirclesSnapshot = {
  /** ISO-8601 timestamp of when the snapshot was generated. */
  generatedAt: string
  /** YYYY-MM-DD lower bound of the active window. */
  activeSinceDate: string
  /** One entry per distinct active city, sorted by "City, Country". */
  circles: ActiveCircleMarker[]
  /** Upcoming events (start date today or later), sorted soonest-first. */
  upcomingEvents: ActiveCircleUpcomingEvent[]
  stats: ActiveCircleStat[]
}
