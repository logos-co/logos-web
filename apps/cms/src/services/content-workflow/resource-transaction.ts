import { sql } from '@payloadcms/db-postgres'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload'

export async function withResourceListLock<T>(
  payload: Payload,
  request: PayloadRequest | undefined,
  path: string,
  save: (req: PayloadRequest) => Promise<T>
) {
  const req = request ?? (await createLocalReq({}, payload))
  const owns = await initTransaction(req)
  try {
    const id = await req.transactionID
    const tx =
      id &&
      (payload.db.sessions?.[id]?.db as typeof payload.db.drizzle | undefined)
    if (!tx)
      throw new Error(
        'A database transaction is required to save a resource list'
      )
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${path}, 0))`
    )
    const result = await save(req)
    if (owns) await commitTransaction(req)
    return result
  } catch (error) {
    if (owns) await killTransaction(req)
    throw error
  }
}
