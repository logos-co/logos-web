export interface BroadcastEventRow {
  id: number
  title: string
  calendarTitle: string
  description: string
  host: string
  date: string
  time?: string
  dateLabel: string
  localDateKey: string
  localTimestamp: number
  timeMinutes: number | null
  typeLabel: string
  topic: string
  guest: string
  speakers: string[]
  notes: string
  links: string[]
  link?: string
}
