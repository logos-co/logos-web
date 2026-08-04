import { asc, desc, eq, sql, type SQL } from 'drizzle-orm'

import type {
  ActivityRecord,
  CreateActivityInput,
  CreateTaskInput,
  TaskRecord,
  UpdateTaskInput,
  WorkListQuery,
  WorkSubjectType,
} from '@/contracts/work'
import { db } from '@/server/db'
import { activities, tasks } from '@/server/db/schema'

type ActivityRow = typeof activities.$inferSelect
type TaskRow = typeof tasks.$inferSelect

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

function toActivityRecord(row: ActivityRow): ActivityRecord {
  return {
    ...readSubject(row),
    id: row.id,
    type: row.type,
    body: row.body,
    occurredAt: row.occurredAt.toISOString(),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  }
}

function toTaskRecord(row: TaskRow): TaskRecord {
  return {
    ...readSubject(row),
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
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

  return rows.map(toActivityRecord)
}

export async function createActivity(
  input: Readonly<CreateActivityInput>
): Promise<ActivityRecord> {
  const [row] = await db
    .insert(activities)
    .values({
      ...subjectValues(input.subjectType, input.subjectId),
      type: input.type,
      body: input.body,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      createdBy: input.createdBy,
    })
    .returning()

  if (!row) throw new Error('The activity was not created.')
  return toActivityRecord(row)
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

  return rows.map(toTaskRecord)
}

export async function createTask(
  input: Readonly<CreateTaskInput>
): Promise<TaskRecord> {
  const [row] = await db
    .insert(tasks)
    .values({
      ...subjectValues(input.subjectType, input.subjectId),
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      assignee: input.assignee,
      dueAt: new Date(input.dueAt),
    })
    .returning()

  if (!row) throw new Error('The task was not created.')
  return toTaskRecord(row)
}

export async function updateTask(
  id: string,
  input: Readonly<UpdateTaskInput>
): Promise<TaskRecord | null> {
  const now = new Date()
  const [row] = await db
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
      ...(input.assignee !== undefined ? { assignee: input.assignee } : {}),
      ...(input.dueAt !== undefined ? { dueAt: new Date(input.dueAt) } : {}),
      updatedAt: now,
    })
    .where(eq(tasks.id, id))
    .returning()

  return row ? toTaskRecord(row) : null
}
