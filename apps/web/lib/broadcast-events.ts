import { parseBroadcastEvents } from '@repo/content/calendar'

import snapshot from './data/broadcast-events.snapshot.json'

/** Called by server pages during the static export. */
export function getBroadcastEvents() {
  return parseBroadcastEvents(snapshot).map((event) => ({
    ...event,
    // Use the same day during the static render and client hydration.
    localDateKey: event.date,
  }))
}
