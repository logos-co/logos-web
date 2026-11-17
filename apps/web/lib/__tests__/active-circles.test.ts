import { afterEach, expect, it, vi } from 'vitest'

import {
  getActiveCirclesOverview,
  getUpcomingCircleEvents,
} from '@/lib/active-circles'

vi.mock('@/lib/data/active-circles.snapshot.json', () => ({
  default: {
    generatedAt: '2026-05-25T12:00:00.000Z',
    activeSinceDate: '2026-01-25',
    circles: [],
    upcomingEvents: [
      { id: 'past', startAt: '2026-06-01T23:30:00' },
      { id: 'today', startAt: '2026-06-02T02:30:00+02:00' },
      { id: 'future', startAt: '2026-06-03T16:00:00' },
    ],
    stats: [
      { id: 'totalEvents', value: 9 },
      { id: 'upcomingEvents', value: 3 },
    ],
  },
}))

afterEach(() => vi.useRealTimers())

it('keeps historical figures and lists and counts only upcoming events from a stored snapshot', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))

  const upcoming = await getUpcomingCircleEvents(1)
  expect(upcoming.map(({ id }) => id)).toEqual(['today'])
  expect(await getActiveCirclesOverview()).toMatchObject({
    snapshotDate: '2026-05-25',
    stats: [
      { id: 'totalEvents', value: 9 },
      { id: 'upcomingEvents', value: 2 },
    ],
  })

  vi.setSystemTime(new Date('2026-06-04T00:00:00Z'))
  expect(await getUpcomingCircleEvents()).toEqual([])
  expect((await getActiveCirclesOverview()).stats).toContainEqual({
    id: 'upcomingEvents',
    value: 0,
  })
})
