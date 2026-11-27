'use client'

import type { BroadcastEventRow } from '@repo/content/calendar'

import { EventsCalendar } from './events-calendar'
import type { EventDetailsCopy, EventsCalendarCopy } from './types'

interface MediaEventsCalendarProps {
  events: BroadcastEventRow[]
  copy: EventsCalendarCopy
  details: EventDetailsCopy
  referenceTime: number
}

export function MediaEventsCalendar(props: MediaEventsCalendarProps) {
  return <EventsCalendar {...props} syncMonthToUrl compact />
}
