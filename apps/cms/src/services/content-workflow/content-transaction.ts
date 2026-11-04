import { sql } from '@payloadcms/db-postgres'
import {
  APIError,
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload'

async function contentTransaction(req: PayloadRequest) {
  const id = await req.transactionID
  const tx =
    id &&
    (req.payload.db.sessions?.[id]?.db as
      | typeof req.payload.db.drizzle
      | undefined)
  if (!tx)
    throw new Error('A database transaction is required to save CMS content')
  return tx
}

// Payload runs bulk hooks concurrently on one transaction. Postgres considers
// its advisory lock already held, so queue those hooks until the PR is updated.
const pendingResourceSaves = new WeakMap<object, Promise<unknown>>()

async function saveResourceInOrder<T>(
  tx: object,
  save: () => Promise<T>
): Promise<T> {
  const previous = pendingResourceSaves.get(tx)
  const next = previous ? previous.then(save, save) : save()
  pendingResourceSaves.set(tx, next)
  try {
    return await next
  } finally {
    if (pendingResourceSaves.get(tx) === next) pendingResourceSaves.delete(tx)
  }
}

async function tryContentLock(
  tx: Awaited<ReturnType<typeof contentTransaction>>,
  key: string
) {
  const lock = await tx.execute<{ acquired: boolean }>(
    sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${key}, 0)) AS acquired`
  )
  if (!lock.rows[0]?.acquired)
    throw new APIError(
      'Another edit or deletion is in progress for this content. Refresh and retry.',
      409,
      undefined,
      true
    )
}

export async function lockResourceRecord(
  req: PayloadRequest,
  collection: string,
  id: string | number
) {
  await tryContentLock(
    await contentTransaction(req),
    `resource:${collection}:${id}`
  )
}

export async function withContentPathLock<T>(
  payload: Payload,
  request: PayloadRequest | undefined,
  path: string,
  save: (req: PayloadRequest) => Promise<T>,
  wait: boolean
) {
  const req = request ?? (await createLocalReq({}, payload))
  const owns = await initTransaction(req)
  try {
    const tx = await contentTransaction(req)
    if (wait) {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${path}, 0))`
      )
    } else {
      // An update may already hold the document row lock while a beforeDelete
      // hook owns the path lock. Reject the overlap before either waits on both.
      await tryContentLock(tx, path)
    }
    const result = wait
      ? await saveResourceInOrder(tx, () => save(req))
      : await save(req)
    if (owns) await commitTransaction(req)
    return result
  } catch (error) {
    if (owns) await killTransaction(req)
    throw error
  }
}
