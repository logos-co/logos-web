/**
 * Shared helpers for the Broadcast Network page sections. `compareEvents` is
 * used by both the upcoming-events cards and the events calendar to keep their
 * ordering identical.
 */
import type { BroadcastEventRow } from '@/lib/blog-engine'

export function compareEvents(a: BroadcastEventRow, b: BroadcastEventRow) {
  if (a.localTimestamp !== b.localTimestamp) {
    return a.localTimestamp - b.localTimestamp
  }

  const minutesA = a.timeMinutes ?? Number.MAX_SAFE_INTEGER
  const minutesB = b.timeMinutes ?? Number.MAX_SAFE_INTEGER
  if (minutesA !== minutesB) return minutesA - minutesB

  return a.id - b.id
}
