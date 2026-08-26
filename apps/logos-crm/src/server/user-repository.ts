import { asc, eq } from 'drizzle-orm'

import type { CreateUserInput, UserRecord } from '@/contracts/user'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'

/** The address convention every existing account follows. */
const COORDINATOR_DOMAIN = 'logos.co'

function deriveEmail(displayName: string): string {
  const local = displayName
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
  return `${local || 'coordinator'}@${COORDINATOR_DOMAIN}`
}

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

/**
 * Adds a coordinator, or returns the one that address already belongs to.
 *
 * Created `active` rather than `pending` on purpose: the only reason to add
 * somebody here is to assign them work, and `listAssignableUsers` excludes
 * pending accounts - so a pending one would be created and then be invisible,
 * which is worse than not offering it at all.
 *
 * Matching on the normalised email makes this idempotent the same way
 * `findOrCreateOrganisation` is: typing a name that resolves to an existing
 * address links to that person instead of making a second account for them.
 */
export async function findOrCreateUser(
  input: Readonly<CreateUserInput>
): Promise<UserRecord> {
  const email = input.email?.trim() || deriveEmail(input.displayName)
  const normalisedEmail = email.toLocaleLowerCase('en')

  const [existing] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      status: users.status,
    })
    .from(users)
    .where(eq(users.normalisedEmail, normalisedEmail))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(users)
    .values({
      displayName: input.displayName.trim(),
      email,
      normalisedEmail,
      status: 'active',
    })
    .returning({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      status: users.status,
    })

  if (!created) throw new Error('The coordinator was not created.')
  return created
}
