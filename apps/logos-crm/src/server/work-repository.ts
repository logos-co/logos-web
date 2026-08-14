import { asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'

import type {
  ActivityRecord,
  CreateActivityInput,
  CreateTaskInput,
  TaskRecord,
  UpdateTaskInput,
  WorkActor,
  WorkListQuery,
  WorkSubjectType,
} from '@/contracts/work'
import { isContactActivity } from '@/contracts/work'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import { activities, cases, tasks, users } from '@/server/db/schema'
import { queueMentionNotifications } from '@/server/notification-repository'

type ActivityRow = typeof activities.$inferSelect
type TaskRow = typeof tasks.$inferSelect

async function loadActors(
  ids: ReadonlyArray<string | null>
): Promise<Map<string, WorkActor>> {
  const unique = [...new Set(ids.filter((id): id is string => id !== null))]
  if (unique.length === 0) return new Map()

  const rows = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(inArray(users.id, unique))

  return new Map(rows.map((row) => [row.id, row]))
}

function requireActor(
  actors: ReadonlyMap<string, WorkActor>,
  id: string
): WorkActor {
  const actor = actors.get(id)
  if (!actor) throw new Error(`No CRM user matches ${id}.`)
  return actor
}

function subjectCondition(
  table: typeof activities | typeof tasks,
  subjectType: WorkSubjectType,
  subjectId: string
): SQL {
  if (subjectType === 'case') return eq(table.caseId, subjectId)
  if (subjectType === 'person') return eq(table.personId, subjectId)
  return eq(table.organisationId, subjectId)
}

function subjectValues(
  subjectType: WorkSubjectType,
  subjectId: string
): {
  caseId?: string
  personId?: string
  organisationId?: string
} {
  if (subjectType === 'case') return { caseId: subjectId }
  if (subjectType === 'person') return { personId: subjectId }
  return { organisationId: subjectId }
}

function readSubject(row: {
  caseId: string | null
  personId: string | null
  organisationId: string | null
}): { subjectType: WorkSubjectType; subjectId: string } {
  if (row.caseId) return { subjectType: 'case', subjectId: row.caseId }
  if (row.personId) return { subjectType: 'person', subjectId: row.personId }
  if (row.organisationId) {
    return { subjectType: 'organisation', subjectId: row.organisationId }
  }
  throw new Error('Work record has no subject.')
}

function toActivityRecord(
  row: ActivityRow,
  actors: ReadonlyMap<string, WorkActor>
): ActivityRecord {
  return {
    ...readSubject(row),
    id: row.id,
    type: row.type,
    body: row.body,
    occurredAt: row.occurredAt.toISOString(),
    createdBy: requireActor(actors, row.createdByUserId),
    createdAt: row.createdAt.toISOString(),
  }
}

function toTaskRecord(
  row: TaskRow,
  actors: ReadonlyMap<string, WorkActor>
): TaskRecord {
  return {
    ...readSubject(row),
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assigneeUserId
      ? requireActor(actors, row.assigneeUserId)
      : null,
    dueAt: row.dueAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listActivities(
  query: Readonly<WorkListQuery>
): Promise<ActivityRecord[]> {
  const rows = await db
    .select()
    .from(activities)
    .where(subjectCondition(activities, query.subjectType, query.subjectId))
    .orderBy(desc(activities.occurredAt), desc(activities.createdAt))

  const actors = await loadActors(rows.map((row) => row.createdByUserId))
  return rows.map((row) => toActivityRecord(row, actors))
}

/**
 * Records an activity and, when it represents actual contact with the record,
 * advances the case's `lastContactAt` cache in the same transaction. Staleness
 * views read that cache, so it must never drift from the timeline it summarises
 * - and a note is not contact.
 */
export async function createActivity(
  actor: Readonly<ActorContext>,
  input: Readonly<CreateActivityInput>
): Promise<ActivityRecord> {
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date()

  const row = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(activities)
      .values({
        ...subjectValues(input.subjectType, input.subjectId),
        type: input.type,
        body: input.body,
        occurredAt,
        createdByUserId: actor.userId,
      })
      .returning()

    if (!created) throw new Error('The activity was not created.')

    // Mentions and their notifications commit with the note. A job that could
    // outlive a rolled-back note would tell somebody about something that never
    // happened.
    await queueMentionNotifications(transaction, actor, {
      activityId: created.id,
      caseId: input.subjectType === 'case' ? input.subjectId : null,
      body: input.body,
    })

    if (input.subjectType === 'case' && isContactActivity(input.type)) {
      await transaction
        .update(cases)
        .set({ lastContactAt: occurredAt })
        .where(
          sql`${cases.id} = ${input.subjectId} and (${cases.lastContactAt} is null or ${cases.lastContactAt} < ${occurredAt})`
        )
    }

    await recordAuditEvent(transaction, actor, {
      action: 'activity.created',
      entityType: 'activity',
      entityId: created.id,
      summary: created.type,
    })

    return created
  })

  const actors = await loadActors([row.createdByUserId])
  return toActivityRecord(row, actors)
}

export async function listTasks(
  query: Readonly<WorkListQuery>
): Promise<TaskRecord[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(subjectCondition(tasks, query.subjectType, query.subjectId))
    .orderBy(
      asc(sql`case when ${tasks.status} = 'open' then 0 else 1 end`),
      asc(tasks.dueAt),
      desc(tasks.createdAt)
    )

  const actors = await loadActors(rows.map((row) => row.assigneeUserId))
  return rows.map((row) => toTaskRecord(row, actors))
}

export async function createTask(
  actor: Readonly<ActorContext>,
  input: Readonly<CreateTaskInput>
): Promise<TaskRecord> {
  const row = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(tasks)
      .values({
        ...subjectValues(input.subjectType, input.subjectId),
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        assigneeUserId: input.assigneeUserId ?? null,
        dueAt: new Date(input.dueAt),
      })
      .returning()

    if (!created) throw new Error('The task was not created.')

    await recordAuditEvent(transaction, actor, {
      action: 'task.created',
      entityType: 'task',
      entityId: created.id,
      summary: created.title,
    })

    return created
  })

  const actors = await loadActors([row.assigneeUserId])
  return toTaskRecord(row, actors)
}

export async function updateTask(
  actor: Readonly<ActorContext>,
  id: string,
  input: Readonly<UpdateTaskInput>
): Promise<TaskRecord | null> {
  const now = new Date()

  const row = await db.transaction(async (transaction) => {
    const [current] = await transaction
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1)
      .for('update')

    if (!current) return null

    const [updated] = await transaction
      .update(tasks)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description || null }
          : {}),
        ...(input.status !== undefined
          ? {
              status: input.status,
              completedAt: input.status === 'completed' ? now : null,
            }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assigneeUserId !== undefined
          ? { assigneeUserId: input.assigneeUserId }
          : {}),
        ...(input.dueAt !== undefined ? { dueAt: new Date(input.dueAt) } : {}),
        updatedAt: now,
      })
      .where(eq(tasks.id, id))
      .returning()

    if (!updated) return null

    await recordAuditEvent(transaction, actor, {
      action: 'task.updated',
      entityType: 'task',
      entityId: id,
      changes: {
        ...(input.status !== undefined
          ? { status: { from: current.status, to: updated.status } }
          : {}),
        ...(input.assigneeUserId !== undefined
          ? {
              assigneeUserId: {
                from: current.assigneeUserId,
                to: updated.assigneeUserId,
              },
            }
          : {}),
      },
    })

    return updated
  })

  if (!row) return null
  const actors = await loadActors([row.assigneeUserId])
  return toTaskRecord(row, actors)
}
