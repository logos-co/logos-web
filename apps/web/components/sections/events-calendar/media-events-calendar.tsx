'use client'

import { EventsCalendar } from './events-calendar'
import { LiveBroadcastEvents } from './live-broadcast-events'
import type { EventDetailsCopy, EventsCalendarCopy } from './types'

interface MediaEventsCalendarProps {
  copy: EventsCalendarCopy
  details: EventDetailsCopy
  referenceTime: number
}

export function MediaEventsCalendar(props: MediaEventsCalendarProps) {
  return (
    <LiveBroadcastEvents>
      {(events) => (
        <EventsCalendar {...props} events={events} syncMonthToUrl compact />
      )}
    </LiveBroadcastEvents>
  )
}
