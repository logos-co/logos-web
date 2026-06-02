// Runtime reader for the active-circles dataset.
//
// Both the `/circles` map (via `getActiveCircleMarkers`) and the
// `/active-circles` list (via `getActiveCirclesOverview`) derive from the SAME
// committed snapshot, so the two surfaces can never diverge. Refresh the
// snapshot with `pnpm --filter web sync:active-circles` (also run automatically
// as part of the web build). Live fetching/derivation lives in
// `active-circles-source.ts`.

import snapshotJson from './data/active-circles.snapshot.json' with { type: 'json' }
import {
  UPCOMING_CIRCLE_EVENTS_LIMIT,
  type ActiveCircleMarker,
  type ActiveCircleUpcomingEvent,
  type ActiveCirclesOverview,
  type ActiveCirclesSnapshot,
} from './active-circles-shared'

export {
  ACTIVE_CIRCLES_DAYS,
  UPCOMING_CIRCLE_EVENTS_LIMIT,
  type ActiveCircleEvent,
  type ActiveCircleLocation,
  type ActiveCircleMarker,
  type ActiveCircleStat,
  type ActiveCircleUpcomingEvent,
  type ActiveCirclesOverview,
  type ActiveCirclesSnapshot,
} from './active-circles-shared'

const snapshot = snapshotJson as ActiveCirclesSnapshot

/**
 * Map markers for the active circles — one per distinct active city, already
 * sorted by "City, Country". Sourced from the committed snapshot.
 */
export async function getActiveCircleMarkers(): Promise<ActiveCircleMarker[]> {
  return snapshot.circles
}

/**
 * The soonest upcoming circle events (start date today or later), capped at
 * {@link UPCOMING_CIRCLE_EVENTS_LIMIT}. Returns an empty array when none are
 * upcoming. Sourced from the same committed snapshot as the map.
 */
export async function getUpcomingCircleEvents(
  limit: number = UPCOMING_CIRCLE_EVENTS_LIMIT
): Promise<ActiveCircleUpcomingEvent[]> {
  return snapshot.upcomingEvents.slice(0, limit)
}

/**
 * Overview for the `/active-circles` page. The location list is derived from
 * the same `snapshot.circles` the map uses, guaranteeing the two stay in sync.
 */
export async function getActiveCirclesOverview(): Promise<ActiveCirclesOverview> {
  return {
    activeSinceDate: snapshot.activeSinceDate,
    activeLocations: snapshot.circles.map((circle) => ({
      label: `${circle.city}, ${circle.country}`,
      href: circle.eventUrl,
    })),
    stats: snapshot.stats,
  }
}
