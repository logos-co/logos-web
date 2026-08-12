import { asc, eq } from 'drizzle-orm'

import type { UserRecord } from '@/contracts/user'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'

/**
 * Users that can be selected as an owner or assignee. Pending and suspended
 * users are excluded: assigning work to an identity that cannot act on it
 * produces queues nobody is accountable for.
 */
export async function listAssignableUsers(): Promise<UserRecord[]> {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      status: users.status,
    })
    .from(users)
    .where(eq(users.status, 'active'))
    .orderBy(asc(users.displayName))
}
