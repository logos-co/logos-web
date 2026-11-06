import { sql } from '@payloadcms/db-postgres'
import {
  APIError,
  type CollectionAfterLoginHook,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type PayloadRequest,
  type TypedUser,
} from 'payload'

async function userTransaction(req: PayloadRequest) {
  const transactionID = await req.transactionID
  const tx =
    transactionID &&
    (req.payload.db.sessions?.[transactionID]?.db as
      | typeof req.payload.db.drizzle
      | undefined)
  if (!tx)
    throw new Error('Changing CMS user roles requires a database transaction')
  return tx
}

export const saveUserRole: CollectionAfterChangeHook = async ({
  operation,
  data,
  doc,
  previousDoc,
  req,
}) => {
  const value = data.role
  if (
    operation !== 'update' ||
    value === previousDoc.role ||
    (value !== 'admin' && value !== 'editor')
  )
    return doc
  // Bulk updates commit successful documents even when others fail validation.
  // Only write the authorised role after this document has actually been saved.
  const tx = await userTransaction(req)
  await tx.execute(sql`UPDATE ${sql.identifier(req.payload.db.schemaName || 'public')}."users"
    SET "role" = ${value} WHERE "id" = ${previousDoc.id}`)
  return 'role' in doc ? { ...doc, role: value } : doc
}

export const readLoginRole: CollectionAfterLoginHook = async ({
  req,
  user,
}) => {
  const stored = await req.payload.db.findOne<TypedUser>({
    collection: 'users',
    where: { id: { equals: user.id } },
    req,
  })
  const currentUser = { ...user, role: stored?.role }
  req.user = currentUser
  return currentUser
}

export const initialiseUserRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || req.user) return data

  // First registration bypasses collection access in Payload. Serialise it so
  // two requests cannot both claim the initial administrator account.
  const tx = await userTransaction(req)
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
  if (
    req.pathname
      ?.replace(/\/+$/, '')
      .toLowerCase()
      .endsWith('/users/first-register')
  ) {
    throw new APIError('The first CMS user already exists.', 403)
  }
  return data
}
