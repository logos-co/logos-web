import { describe, expect, test } from 'vitest'

import type { BroadcastEventRow } from '@/lib/blog-engine'

import {
  buildCalendarDays,
  formatCalendarKey,
  formatUtcOffsetLabel,
  getCalendarYears,
  getInitialAnchor,
  parseMonthQuery,
  pickSelectedKey,
} from '../calendar-dates'

const byLocalDateKey = (event: BroadcastEventRow) => event.localDateKey

const makeEvent = (
  overrides: Partial<BroadcastEventRow> & Pick<BroadcastEventRow, 'id'>
): BroadcastEventRow => ({
  title: 'λ X Space',
  calendarTitle: 'λ X Space',
  description: '',
  host: 'Logos Network',
  date: '2026-10-13',
  dateLabel: 'Tuesday, October 13',
  localDateKey: '2026-10-13',
  localTimestamp: new Date(2026, 9, 13, 17).getTime(),
  timeMinutes: 1020,
  typeLabel: 'λ X Space',
  topic: '',
  guest: '',
  speakers: [],
  notes: '',
  links: [],
  ...overrides,
})

describe('parseMonthQuery', () => {
  test('reads a one-based month into a zero-based calendar month', () => {
    expect(parseMonthQuery('?year=2026&month=10')).toEqual({
      year: 2026,
      month: 9,
    })
  })

  test.each([
    ['', 'missing params'],
    ['?year=2026', 'missing month'],
    ['?year=2026&month=13', 'month out of range'],
    ['?year=2026&month=0', 'month zero'],
    ['?year=1800&month=1', 'year out of range'],
    ['?year=abc&month=1', 'non-numeric year'],
    ['?year=2026&month=1.5', 'fractional month'],
  ])('returns null for %s (%s)', (search) => {
    expect(parseMonthQuery(search)).toBeNull()
  })
})

describe('buildCalendarDays', () => {
  test('pads the month to whole Monday-first weeks', () => {
    const days = buildCalendarDays([], { year: 2026, month: 9 }, byLocalDateKey)

    expect(days).toHaveLength(35)
    expect(days[0]).toMatchObject({ key: '2026-09-28', isCurrentMonth: false })
    expect(days[3]).toMatchObject({ key: '2026-10-01', isCurrentMonth: true })
    expect(days.at(-1)).toMatchObject({
      key: '2026-11-01',
      isCurrentMonth: false,
    })
  })

  test('keeps every event for the day but one pill per title', () => {
    const late = makeEvent({ id: 1, localTimestamp: 2, calendarTitle: 'Late' })
    const early = makeEvent({
      id: 2,
      localTimestamp: 1,
      calendarTitle: 'Early',
    })
    const duplicate = makeEvent({
      id: 3,
      localTimestamp: 3,
      calendarTitle: 'Late',
    })

    const days = buildCalendarDays(
      [late, early, duplicate],
      { year: 2026, month: 9 },
      byLocalDateKey
    )
    const day = days.find((item) => item.key === '2026-10-13')

    expect(day?.events.map((event) => event.id)).toEqual([2, 1, 3])
    expect(day?.pillEvents.map((event) => event.id)).toEqual([2, 1])
  })
})

describe('getInitialAnchor', () => {
  test('opens on the nearest upcoming event', () => {
    const past = makeEvent({
      id: 1,
      localDateKey: '2026-09-01',
      localTimestamp: new Date(2026, 8, 1).getTime(),
    })
    const upcoming = makeEvent({
      id: 2,
      localDateKey: '2026-11-05',
      localTimestamp: new Date(2026, 10, 5).getTime(),
    })

    expect(
      getInitialAnchor([past, upcoming], new Date(2026, 9, 13), byLocalDateKey)
    ).toEqual({ year: 2026, month: 10, dayKey: '2026-11-05' })
  })

  test('falls back to the latest event when none are upcoming', () => {
    const past = makeEvent({
      id: 1,
      localDateKey: '2026-09-01',
      localTimestamp: new Date(2026, 8, 1).getTime(),
    })

    expect(
      getInitialAnchor([past], new Date(2026, 9, 13), byLocalDateKey)
    ).toEqual({ year: 2026, month: 8, dayKey: '2026-09-01' })
  })

  test('falls back to today when there are no events', () => {
    const now = new Date(2026, 9, 13)

    expect(getInitialAnchor([], now, byLocalDateKey)).toEqual({
      year: 2026,
      month: 9,
      dayKey: formatCalendarKey(now),
    })
  })
})

describe('pickSelectedKey', () => {
  test('prefers the hint, then the first day with events', () => {
    const event = makeEvent({ id: 1 })
    const days = buildCalendarDays(
      [event],
      { year: 2026, month: 9 },
      byLocalDateKey
    )

    expect(pickSelectedKey(days, '2026-10-02')).toBe('2026-10-02')
    expect(pickSelectedKey(days, '2026-09-28')).toBe('2026-10-13')
    expect(pickSelectedKey(days)).toBe('2026-10-13')
  })
})

describe('formatUtcOffsetLabel', () => {
  test('formats whole and fractional offsets', () => {
    const withOffset = (minutes: number) =>
      ({ getTimezoneOffset: () => minutes }) as Date

    expect(formatUtcOffsetLabel(withOffset(-540))).toBe('UTC+9')
    expect(formatUtcOffsetLabel(withOffset(420))).toBe('UTC-7')
    expect(formatUtcOffsetLabel(withOffset(-330))).toBe('UTC+5:30')
    expect(formatUtcOffsetLabel(withOffset(0))).toBe('UTC+0')
  })
})

describe('getCalendarYears', () => {
  test('includes the visible year even without events in it', () => {
    const event = makeEvent({ id: 1, localDateKey: '2026-10-13' })

    expect(
      getCalendarYears([event], new Date(2026, 9, 13), byLocalDateKey, 2099)
    ).toEqual([2025, 2026, 2027, 2099])
  })
})
