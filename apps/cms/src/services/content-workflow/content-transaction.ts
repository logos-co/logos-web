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
    const id = await req.transactionID
    const tx =
      id &&
      (payload.db.sessions?.[id]?.db as typeof payload.db.drizzle | undefined)
    if (!tx)
      throw new Error('A database transaction is required to save CMS content')
    if (wait) {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${path}, 0))`
      )
    } else {
      // An update may already hold the document row lock while a beforeDelete
      // hook owns the path lock. Reject the overlap before either waits on both.
      const lock = await tx.execute<{ acquired: boolean }>(
        sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${path},0)) AS acquired`
      )
      if (!lock.rows[0]?.acquired)
        throw new APIError(
          'Another edit or deletion is in progress for this content. Refresh and retry.',
          409,
          undefined,
          true
        )
    }
    const result = await save(req)
    if (owns) await commitTransaction(req)
    return result
  } catch (error) {
    if (owns) await killTransaction(req)
    throw error
  }
}
