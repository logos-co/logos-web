import type { PublishRun } from '../publish-status'
import type { PublishReservation, PublishReservations } from '../reservations'

export const run = (overrides: Partial<PublishRun> = {}): PublishRun => ({
  id: 10,
  runUrl: 'https://github.com/example/site/actions/runs/10',
  state: 'finished',
  conclusion: 'SUCCESS',
  succeeded: true,
  hasSnapshot: true,
  startedAt: '2026-10-01T10:00:00Z',
  finishedAt: '2026-10-01T10:07:00Z',
  ...overrides,
})

export const memoryReservations = (): PublishReservations => {
  let current: PublishReservation | null = null
  let nextToken = 0
  return {
    acquire: async (environment, baselineBuild) => {
      if (current) return null
      current = { environment, baselineBuild, token: String(++nextToken) }
      return current
    },
    read: async () => current,
    release: async (token) => {
      if (current?.token === token) current = null
    },
  }
}
