import { sql } from '@payloadcms/db-postgres'
import { APIError, type CollectionBeforeChangeHook } from 'payload'

export const initialiseUserRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || req.user) return data

  // First registration bypasses collection access in Payload. Serialise it so
  // two requests cannot both claim the initial administrator account.
  const transactionID = await req.transactionID
  const tx =
    transactionID &&
    (req.payload.db.sessions?.[transactionID]?.db as
      | typeof req.payload.db.drizzle
      | undefined)
  if (!tx)
    throw new Error('Creating a CMS user requires a database transaction')
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(
    ${`${req.payload.db.schemaName}:first-cms-user`}, 0))`)
  const existing = await req.payload.find({
    collection: 'users',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (existing.totalDocs === 0) return { ...data, role: 'admin' }
  if (req.pathname?.replace(/\/+$/, '').endsWith('/users/first-register')) {
    throw new APIError('The first CMS user already exists.', 403)
  }
  return data
}
