import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import type { PublishEnvironment } from './environments'
import type { PublishStatusResult } from './load-publish-status'

export interface PublishReservation {
  token: string
  environment: PublishEnvironment
  baselineBuild: number
}

export interface PublishReservations {
  acquire: (
    environment: PublishEnvironment,
    baselineBuild: number
  ) => Promise<PublishReservation | null>
  read: () => Promise<PublishReservation | null>
  release: (token: string) => Promise<void>
}

export const createPublishReservations = (
  db: Pick<Payload['db'], 'pool' | 'schemaName'>
): PublishReservations => {
  const schema = (db.schemaName ?? 'payload').replaceAll('"', '""')
  const table = `"${schema}"."site_publish_reservations"`
  return {
    acquire: async (environment, baselineBuild) => {
      const reservation = { token: randomUUID(), environment, baselineBuild }
      // The unique key serialises both environments across all CMS replicas.
      const result = await db.pool.query(
        `INSERT INTO ${table} (key, token, environment, baseline_build, created_at, updated_at)
         VALUES ('site', $1, $2, $3, NOW(), NOW())
         ON CONFLICT (key) DO NOTHING RETURNING token`,
        [reservation.token, environment, baselineBuild]
      )
      return result.rowCount ? reservation : null
    },
    read: async () => {
      const result = await db.pool.query<PublishReservation>(
        `SELECT token, environment, baseline_build::float8 AS "baselineBuild" FROM ${table} WHERE key = 'site'`
      )
      return result.rows[0] ?? null
    },
    release: async (token) => {
      await db.pool.query(`DELETE FROM ${table} WHERE token = $1`, [token])
    },
  }
}

export const withPublishReservation =
  (
    loadStatus: () => Promise<PublishStatusResult>,
    reservations: PublishReservations
  ): (() => Promise<PublishStatusResult>) =>
  async () => {
    // Read the reservation first: a new request may be created during the API read.
    const reservation = await reservations.read()
    const result = await loadStatus()
    if (!reservation) return result
    const latest = result.status[reservation.environment].latestRun
    if (
      latest &&
      (latest.state === 'queued' || latest.id > reservation.baselineBuild)
    ) {
      await reservations.release(reservation.token)
      return result
    }
    const blockedReason =
      'A build request is awaiting confirmation from GitHub Actions.'
    return {
      ...result,
      status: {
        dev: {
          ...result.status.dev,
          canPublish: false,
          blockedReason,
          blockedReasonKey: 'requestPending',
        },
        production: {
          ...result.status.production,
          canPublish: false,
          blockedReason,
          blockedReasonKey: 'requestPending',
        },
      },
    }
  }
