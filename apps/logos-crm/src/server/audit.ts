import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { auditEvents } from '@/server/db/schema'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Work that no user initiated — public funnel intake, scheduled jobs. The audit
 * row still needs a request ID to correlate with, but attributing it to a
 * person would be a lie.
 */
export interface SystemActor {
  userId: null
  requestId: string
}

export type AuditActor =
  | Pick<ActorContext, 'userId' | 'requestId'>
  | SystemActor

export function systemActor(requestId: string): SystemActor {
  return { userId: null, requestId }
}

export interface AuditEventInput {
  action: string
  entityType: 'case' | 'person' | 'organisation' | 'task' | 'activity'
  entityId: string
  summary?: string
  /**
   * A redacted before/after projection. Never pass note bodies, contact
   * details, or anything else that would turn the audit log into a second copy
   * of the personal data it is supposed to describe.
   */
  changes?: Record<string, { from: unknown; to: unknown }>
}

/**
 * Writes an audit event. Always call this inside the same transaction as the
 * mutation it describes — an audit row that can commit without its mutation
 * (or the reverse) is worse than no audit row, because it is trusted.
 */
export async function recordAuditEvent(
  transaction: Transaction,
  actor: Readonly<AuditActor>,
  input: Readonly<AuditEventInput>
): Promise<void> {
  await transaction.insert(auditEvents).values({
    actorUserId: actor.userId,
    requestId: actor.requestId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary ?? null,
    changes: input.changes ?? null,
  })
}
