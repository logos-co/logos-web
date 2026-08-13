import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'

import type {
  CaseQueue,
  CaseRecord,
  CaseStatus,
  CreateCaseInput,
  UpdateCaseStatusInput,
} from '@/contracts/case'
import { caseStatusTransitions } from '@/contracts/values'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { db } from '@/server/db'
import {
  caseAssignments,
  caseOrganisations,
  casePeople,
  caseWorkflowHistory,
  cases,
  organisations,
  people,
  tasks,
  users,
} from '@/server/db/schema'
import { conflict, invalidTransition, notFound } from '@/server/service-errors'

export interface CaseListFilters {
  q?: string
  status?: CaseStatus
  queue?: CaseQueue
  ownerUserId?: string
}

interface CaseRelations {
  organisationId: string | null
  organisationName: string | null
  owner: CaseRecord['owner']
  nextTask: CaseRecord['nextTask']
  openTaskCount: number
  relatedPeople: CaseRecord['relatedPeople']
}

/** Statuses that still represent live work. */
const OPEN_STATUSES: ReadonlyArray<CaseStatus> = [
  'new',
  'in_progress',
  'waiting',
]

/**
 * How long an open case may go without contact before it is considered stale.
 * Deliberately a named constant: it is a working agreement about follow-up, and
 * changing it changes which cases people are asked to chase.
 */
export const STALE_AFTER_DAYS = 14

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return (caseStatusTransitions[from] as ReadonlyArray<CaseStatus>).includes(to)
}

function toCaseRecord(
  row: typeof cases.$inferSelect,
  relations: CaseRelations
): CaseRecord {
  return {
    ...row,
    ...relations,
    nextActionAt: row.nextActionAt?.toISOString() ?? null,
    lastContactAt: row.lastContactAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function hydrateCaseRecords(
  rows: ReadonlyArray<typeof cases.$inferSelect>
): Promise<CaseRecord[]> {
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)
  const ownerIds = [
    ...new Set(
      rows
        .map((row) => row.ownerUserId)
        .filter((value): value is string => value !== null)
    ),
  ]

  const [organisationLinks, peopleLinks, ownerRows, openTasks] =
    await Promise.all([
      db
        .select({
          caseId: caseOrganisations.caseId,
          organisationId: caseOrganisations.organisationId,
          displayName: organisations.displayName,
          primary: caseOrganisations.isPrimary,
        })
        .from(caseOrganisations)
        .innerJoin(
          organisations,
          eq(caseOrganisations.organisationId, organisations.id)
        )
        .where(inArray(caseOrganisations.caseId, ids)),
      db
        .select({
          caseId: casePeople.caseId,
          id: people.id,
          fullName: people.fullName,
          roleTitle: people.roleTitle,
          primary: casePeople.isPrimary,
        })
        .from(casePeople)
        .innerJoin(people, eq(casePeople.personId, people.id))
        .where(inArray(casePeople.caseId, ids)),
      ownerIds.length > 0
        ? db
            .select({ id: users.id, displayName: users.displayName })
            .from(users)
            .where(inArray(users.id, ownerIds))
        : Promise.resolve<CaseRecord['owner'][]>([]),
      db
        .select({
          id: tasks.id,
          caseId: tasks.caseId,
          title: tasks.title,
          dueAt: tasks.dueAt,
          assigneeUserId: tasks.assigneeUserId,
          assigneeName: users.displayName,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assigneeUserId, users.id))
        .where(and(inArray(tasks.caseId, ids), eq(tasks.status, 'open')))
        .orderBy(asc(tasks.dueAt)),
    ])

  const organisationByCase = new Map<string, { id: string; name: string }>(
    [...organisationLinks]
      .sort((left, right) => Number(right.primary) - Number(left.primary))
      .map((row) => [
        row.caseId,
        { id: row.organisationId, name: row.displayName },
      ])
  )
  const ownerById = new Map<string, NonNullable<CaseRecord['owner']>>(
    ownerRows
      .filter((row): row is NonNullable<CaseRecord['owner']> => row !== null)
      .map((row) => [row.id, row])
  )
  // Tasks arrive ordered by due date, so the first one seen per case is the
  // next thing due on it.
  const nextTaskByCase = new Map<string, NonNullable<CaseRecord['nextTask']>>()
  const openTaskCountByCase = new Map<string, number>()
  for (const task of openTasks) {
    if (!task.caseId) continue
    openTaskCountByCase.set(
      task.caseId,
      (openTaskCountByCase.get(task.caseId) ?? 0) + 1
    )
    if (nextTaskByCase.has(task.caseId)) continue
    nextTaskByCase.set(task.caseId, {
      id: task.id,
      title: task.title,
      dueAt: task.dueAt.toISOString(),
      assignee:
        task.assigneeUserId && task.assigneeName
          ? { id: task.assigneeUserId, displayName: task.assigneeName }
          : null,
    })
  }

  const peopleByCase = new Map<string, CaseRecord['relatedPeople']>()
  for (const link of [...peopleLinks].sort(
    (left, right) => Number(right.primary) - Number(left.primary)
  )) {
    const existing = peopleByCase.get(link.caseId) ?? []
    peopleByCase.set(link.caseId, [
      ...existing,
      { id: link.id, fullName: link.fullName, roleTitle: link.roleTitle },
    ])
  }

  return rows.map((row) => {
    const organisation = organisationByCase.get(row.id) ?? null
    const owner = row.ownerUserId
      ? (ownerById.get(row.ownerUserId) ?? null)
      : null
    return toCaseRecord(row, {
      organisationId: organisation?.id ?? null,
      organisationName: organisation?.name ?? null,
      owner,
      nextTask: nextTaskByCase.get(row.id) ?? null,
      openTaskCount: openTaskCountByCase.get(row.id) ?? 0,
      relatedPeople: peopleByCase.get(row.id) ?? [],
    })
  })
}

/**
 * Builds the predicate for a queue. Each one is a question a coordinator asks
 * at the start of the day, answered against the whole table rather than the
 * page currently on screen.
 */
function queueCondition(
  queue: CaseQueue,
  actorUserId: string | null
): SQL | undefined {
  switch (queue) {
    case 'mine':
      // With no resolvable actor this must match nothing rather than
      // everything: a broken "my work" that shows the whole table is worse
      // than one that shows none of it.
      return actorUserId ? eq(cases.ownerUserId, actorUserId) : sql`false`

    case 'unassigned':
      return and(
        isNull(cases.ownerUserId),
        inArray(cases.status, [...OPEN_STATUSES])
      )

    case 'needs_triage':
      return eq(cases.status, 'new')

    case 'overdue':
      // Derived from the open task, not from the case's own next-action date:
      // the task is the commitment somebody made.
      return sql`exists (
        select 1 from ${tasks}
        where ${tasks.caseId} = ${cases.id}
          and ${tasks.status} = 'open'
          and ${tasks.dueAt} < now()
      )`

    case 'stale':
      return and(
        inArray(cases.status, [...OPEN_STATUSES]),
        sql`(${cases.lastContactAt} is null or ${cases.lastContactAt} < now() - make_interval(days => ${STALE_AFTER_DAYS}))`
      )

    case 'all':
    default:
      return undefined
  }
}

export async function listCases(
  filters: Readonly<CaseListFilters> = {},
  actorUserId: string | null = null
): Promise<CaseRecord[]> {
  const conditions: SQL[] = []

  if (filters.status) {
    conditions.push(eq(cases.status, filters.status))
  }

  if (filters.ownerUserId) {
    conditions.push(eq(cases.ownerUserId, filters.ownerUserId))
  }

  const queue = queueCondition(filters.queue ?? 'all', actorUserId)
  if (queue) conditions.push(queue)

  if (filters.q) {
    const query = `%${filters.q}%`
    const matchingOwners = db
      .select({ id: users.id })
      .from(users)
      .where(ilike(users.displayName, query))
    const matchingOrganisationCases = db
      .select({ caseId: caseOrganisations.caseId })
      .from(caseOrganisations)
      .innerJoin(
        organisations,
        eq(caseOrganisations.organisationId, organisations.id)
      )
      .where(ilike(organisations.displayName, query))

    const searchCondition = or(
      ilike(cases.title, query),
      ilike(cases.stage, query),
      inArray(cases.ownerUserId, matchingOwners),
      inArray(cases.id, matchingOrganisationCases)
    )
    if (searchCondition) conditions.push(searchCondition)
  }

  const rows = await db
    .select()
    .from(cases)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(cases.updatedAt))

  return hydrateCaseRecords(rows)
}

export async function getCase(id: string): Promise<CaseRecord | null> {
  const [row] = await db.select().from(cases).where(eq(cases.id, id)).limit(1)
  if (!row) return null
  return (await hydrateCaseRecords([row]))[0] ?? null
}

/**
 * Creates a case, opens its assignment interval, records the opening workflow
 * row, and audits the whole thing in one transaction. All four commit together
 * or none of them do: a case whose history starts halfway through its life is
 * not recoverable later.
 */
export async function createCase(
  actor: Readonly<ActorContext>,
  input: Readonly<CreateCaseInput>
): Promise<CaseRecord> {
  const created = await db.transaction(async (transaction) => {
    const { organisationId, personIds, nextActionAt, ...caseInput } = input
    const [row] = await transaction
      .insert(cases)
      .values({
        ...caseInput,
        nextActionAt: nextActionAt ? new Date(nextActionAt) : null,
        status: 'new',
      })
      .returning()

    if (!row) throw new Error('The case was not created.')

    await transaction.insert(caseAssignments).values({
      caseId: row.id,
      ownerUserId: row.ownerUserId,
      teamId: row.teamId,
      assignedByUserId: actor.userId,
      validFrom: row.createdAt,
    })

    await transaction.insert(caseWorkflowHistory).values({
      caseId: row.id,
      fromStatus: null,
      toStatus: row.status,
      fromStage: null,
      toStage: row.stage,
      effectiveAt: row.createdAt,
      actorUserId: actor.userId,
    })

    if (organisationId) {
      await transaction.insert(caseOrganisations).values({
        caseId: row.id,
        organisationId,
        isPrimary: true,
      })
    }
    if (personIds.length > 0) {
      await transaction.insert(casePeople).values(
        personIds.map((personId, index) => ({
          caseId: row.id,
          personId,
          isPrimary: index === 0,
        }))
      )
    }

    await recordAuditEvent(transaction, actor, {
      action: 'case.created',
      entityType: 'case',
      entityId: row.id,
      summary: row.title,
    })

    return row
  })

  const [record] = await hydrateCaseRecords([created])
  if (!record) throw new Error('The case was not created.')
  return record
}

/**
 * Applies a status transition. Rejects unlisted transitions and stale versions
 * before writing, then commits the row, its history, and its audit event
 * together.
 */
export async function updateCaseStatus(
  actor: Readonly<ActorContext>,
  id: string,
  input: Readonly<UpdateCaseStatusInput>
): Promise<CaseRecord> {
  const updated = await db.transaction(async (transaction) => {
    const [current] = await transaction
      .select()
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1)
      .for('update')

    if (!current) throw notFound('The case no longer exists.')

    if (current.version !== input.expectedVersion) {
      throw conflict(
        'The case changed since it was loaded. Reload it and try again.'
      )
    }

    if (current.status === input.status) return current

    if (!canTransition(current.status, input.status)) {
      throw invalidTransition('Unsupported status transition.', {
        status: `A case cannot move from ${current.status} to ${input.status}.`,
      })
    }

    const now = new Date()
    const [row] = await transaction
      .update(cases)
      .set({
        status: input.status,
        version: current.version + 1,
        updatedAt: now,
      })
      .where(eq(cases.id, id))
      .returning()

    if (!row) throw notFound('The case no longer exists.')

    await transaction.insert(caseWorkflowHistory).values({
      caseId: row.id,
      fromStatus: current.status,
      toStatus: row.status,
      fromStage: current.stage,
      toStage: row.stage,
      effectiveAt: now,
      actorUserId: actor.userId,
      reason: input.reason ?? null,
    })

    await recordAuditEvent(transaction, actor, {
      action: 'case.status_changed',
      entityType: 'case',
      entityId: row.id,
      summary: input.reason ?? undefined,
      changes: { status: { from: current.status, to: row.status } },
    })

    return row
  })

  const [record] = await hydrateCaseRecords([updated])
  if (!record) throw notFound('The case no longer exists.')
  return record
}

/**
 * Reassigns a case: closes the open assignment interval and opens a new one, so
 * "who owned this on a given date" stays answerable.
 */
export async function assignCase(
  actor: Readonly<ActorContext>,
  id: string,
  ownerUserId: string | null,
  options: Readonly<{ expectedVersion: number; reason?: string }>
): Promise<CaseRecord> {
  const updated = await db.transaction(async (transaction) => {
    const [current] = await transaction
      .select()
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1)
      .for('update')

    if (!current) throw notFound('The case no longer exists.')
    if (current.version !== options.expectedVersion) {
      throw conflict(
        'The case changed since it was loaded. Reload it and try again.'
      )
    }
    if (current.ownerUserId === ownerUserId) return current

    const now = new Date()

    await transaction
      .update(caseAssignments)
      .set({ validTo: now })
      .where(
        and(eq(caseAssignments.caseId, id), isNull(caseAssignments.validTo))
      )

    await transaction.insert(caseAssignments).values({
      caseId: id,
      ownerUserId,
      teamId: current.teamId,
      assignedByUserId: actor.userId,
      validFrom: now,
      reason: options.reason ?? null,
    })

    const [row] = await transaction
      .update(cases)
      .set({ ownerUserId, version: current.version + 1, updatedAt: now })
      .where(eq(cases.id, id))
      .returning()

    if (!row) throw notFound('The case no longer exists.')

    await recordAuditEvent(transaction, actor, {
      action: 'case.reassigned',
      entityType: 'case',
      entityId: id,
      summary: options.reason ?? undefined,
      changes: {
        ownerUserId: { from: current.ownerUserId, to: ownerUserId },
      },
    })

    return row
  })

  const [record] = await hydrateCaseRecords([updated])
  if (!record) throw notFound('The case no longer exists.')
  return record
}

/**
 * Counts for the queue tabs. Each count uses the same predicate as the queue it
 * labels, so a tab reading "3" and its list showing three rows cannot disagree.
 */
export async function countCasesByQueue(
  actorUserId: string | null
): Promise<Record<CaseQueue, number>> {
  const queues: CaseQueue[] = [
    'all',
    'mine',
    'unassigned',
    'needs_triage',
    'overdue',
    'stale',
  ]

  const results = await Promise.all(
    queues.map(async (queue) => {
      const condition = queueCondition(queue, actorUserId)
      const [row] = await db
        .select({ value: count() })
        .from(cases)
        .where(condition)
      return [queue, row?.value ?? 0] as const
    })
  )

  return Object.fromEntries(results) as Record<CaseQueue, number>
}

export async function getDashboardSummary(): Promise<{
  total: number
  openTotal: number
  byStatus: Record<CaseStatus, number>
}> {
  const rows = await db
    .select({ status: cases.status, value: count() })
    .from(cases)
    .groupBy(cases.status)

  const byStatus: Record<CaseStatus, number> = {
    new: 0,
    in_progress: 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
  }

  for (const row of rows) byStatus[row.status] = row.value

  return {
    total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
    openTotal: byStatus.new + byStatus.in_progress + byStatus.waiting,
    byStatus,
  }
}
