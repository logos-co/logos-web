import { sql } from '@payloadcms/db-postgres'
import { drizzle } from '@payloadcms/db-postgres/drizzle/node-postgres'
import { APIError, type Payload, type PayloadRequest } from 'payload'

// A rename must remain discoverable if the edit transaction rolls back after
// GitHub accepts it. Mirror SQL errors must not abort that transaction either.
// Reserve one idle-closing connection so neither write waits for its own pool.
const recoveryDatabases = new WeakMap<Payload, ReturnType<typeof drizzle>>()

export function resourceRecoveryDb(payload: Payload) {
  const existing = recoveryDatabases.get(payload)
  if (existing) return existing
  const adapter = payload.db
  if (!adapter.pg) throw new Error('Resource recovery requires PostgreSQL')
  const pool = new adapter.pg.Pool({
    ...adapter.poolOptions,
    max: 1,
    allowExitOnIdle: true,
    idleTimeoutMillis: 10000,
  })
  pool.on('error', (error) =>
    payload.logger.error(
      { err: error },
      'Resource recovery database connection failed'
    )
  )
  const db = drizzle(pool)
  recoveryDatabases.set(payload, db)
  return db
}

export async function prepareResourceRename(
  req: PayloadRequest,
  {
    list,
    id,
    slugs,
    previous,
    requested,
    deleting,
  }: {
    list: string
    id: string | number
    slugs: readonly string[]
    previous: string
    requested: string
    deleting: boolean
  }
) {
  const record = list + ':' + id
  const { payload } = req
  const { docs } = await payload.find({
    collection: 'resource-renames',
    req,
    overrideAccess: true,
    depth: 0,
    limit: 2,
    where: {
      list: { equals: list },
      or: [
        { record: { equals: record } },
        { fromSlug: { in: [previous, requested] } },
        { toSlug: { in: [previous, requested] } },
      ],
    },
  })
  if (docs.some((row) => row.record !== record))
    throw new APIError(
      'Another resource has an unfinished rename involving this slug.',
      409,
      undefined,
      true
    )
  const pending = docs[0]
  let source = previous
  if (pending) {
    if (slugs.includes(pending.fromSlug) && slugs.includes(pending.toSlug))
      throw new APIError(
        'Both names of the unfinished resource rename exist in Git. Resolve the conflict before editing.',
        409,
        undefined,
        true
      )
    source = slugs.includes(pending.toSlug) ? pending.toSlug : pending.fromSlug
  }
  const target = requested === previous ? source : requested
  if (!deleting && source !== target && slugs.includes(target))
    throw new APIError(
      'The requested resource slug already exists in Git.',
      409,
      undefined,
      true
    )
  const renamed = !deleting && source !== target
  if (renamed && (pending?.fromSlug !== source || pending.toSlug !== target)) {
    const table = sql`${sql.identifier(payload.db.schemaName ?? 'payload')}."resource_renames"`
    await resourceRecoveryDb(payload)
      .execute(sql`INSERT INTO ${table} (record,list,from_slug,to_slug)
      VALUES (${record},${list},${source},${target})
      ON CONFLICT (record) DO UPDATE SET from_slug = EXCLUDED.from_slug, to_slug = EXCLUDED.to_slug, updated_at = now()`)
  }
  return {
    source,
    target,
    recovering: Boolean(pending),
    clear: async () => {
      if (pending || renamed)
        await payload.db.deleteMany({
          collection: 'resource-renames',
          where: { record: { equals: record } },
          req,
        })
    },
  }
}
