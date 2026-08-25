import { and, desc, eq, isNotNull } from 'drizzle-orm'

import { statusLabels } from '@/contracts/case-labels'
import type { PipelineKey } from '@/contracts/pipeline'
import { integrationStageLabel, stageLabel } from '@/contracts/pipeline'
import type { TimelineEntry, TimelineQuery } from '@/contracts/timeline'
import type { WorkActor } from '@/contracts/work'
import { db } from '@/server/db'
import {
  activities,
  caseAssignments,
  caseWorkflowHistory,
  cases,
  tasks,
  users,
} from '@/server/db/schema'

async function loadActors(
  ids: ReadonlyArray<string | null>
): Promise<Map<string, WorkActor>> {
  const unique = [...new Set(ids.filter((id): id is string => id !== null))]
  if (unique.length === 0) return new Map()

  const rows = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
  return new Map(
    rows
      .filter((row) => unique.includes(row.id))
      .map((row) => [row.id, { id: row.id, displayName: row.displayName }])
  )
}

const activityVerbs: Record<string, string> = {
  note: 'left a note',
  call: 'logged a call',
  email: 'logged an email',
  meeting: 'logged a meeting',
}

/**
 * Builds the merged history for one record.
 *
 * Everything but notes is derived, so an entry can never claim something the
 * underlying tables do not. Notes carry their body because a timeline that
 * summarised them ("left a note") without showing them would just be the tab
 * this replaces.
 */
export async function listTimeline(
  query: Readonly<TimelineQuery>
): Promise<TimelineEntry[]> {
  const subjectColumn =
    query.subjectType === 'case'
      ? activities.caseId
      : query.subjectType === 'person'
        ? activities.personId
        : activities.organisationId

  const taskColumn =
    query.subjectType === 'case'
      ? tasks.caseId
      : query.subjectType === 'person'
        ? tasks.personId
        : tasks.organisationId

  const [activityRows, taskRows] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(eq(subjectColumn, query.subjectId))
      .orderBy(desc(activities.occurredAt)),
    db
      .select()
      .from(tasks)
      .where(eq(taskColumn, query.subjectId))
      .orderBy(desc(tasks.createdAt)),
  ])

  // Workflow, assignment, and decision history exist for cases only: a person
  // or an organisation has no stage to move through.
  const isCase = query.subjectType === 'case'
  const [historyRows, assignmentRows, caseRows] = isCase
    ? await Promise.all([
        db
          .select()
          .from(caseWorkflowHistory)
          .where(eq(caseWorkflowHistory.caseId, query.subjectId))
          .orderBy(desc(caseWorkflowHistory.effectiveAt)),
        db
          .select()
          .from(caseAssignments)
          .where(
            and(
              eq(caseAssignments.caseId, query.subjectId),
              isNotNull(caseAssignments.ownerUserId)
            )
          ),
        db.select().from(cases).where(eq(cases.id, query.subjectId)).limit(1),
      ])
    : [[], [], []]

  const actors = await loadActors([
    ...activityRows.flatMap((row) => [row.createdByUserId, row.editedByUserId]),
    ...taskRows.map((row) => row.assigneeUserId),
    ...historyRows.map((row) => row.actorUserId),
    ...assignmentRows.flatMap((row) => [row.ownerUserId, row.assignedByUserId]),
    ...caseRows.map((row) => row.decidedByUserId),
  ])

  const caseRow = caseRows[0]
  const pipeline = (caseRow?.pipeline ?? 'ecodev') as PipelineKey

  const entries: TimelineEntry[] = [
    ...activityRows.map((row) => ({
      id: `activity:${row.id}`,
      kind: (row.type === 'note' ? 'note' : 'contact') as TimelineEntry['kind'],
      occurredAt: row.occurredAt.toISOString(),
      summary: activityVerbs[row.type] ?? 'recorded activity',
      body: row.deletedAt ? null : row.body,
      actor: actors.get(row.createdByUserId) ?? null,
      activityId: row.id,
      editedAt: row.editedAt?.toISOString() ?? null,
      isDeleted: row.deletedAt !== null,
    })),

    ...taskRows.map((row) => ({
      id: `task-open:${row.id}`,
      kind: 'task_opened' as const,
      occurredAt: row.createdAt.toISOString(),
      summary: `opened the task "${row.title}"`,
      body: null,
      actor: row.assigneeUserId
        ? (actors.get(row.assigneeUserId) ?? null)
        : null,
      activityId: null,
      editedAt: null,
      isDeleted: false,
    })),

    ...taskRows
      .filter((row) => row.completedAt !== null)
      .map((row) => ({
        id: `task-done:${row.id}`,
        kind: 'task_completed' as const,
        occurredAt: (row.completedAt as Date).toISOString(),
        summary: `completed "${row.title}"`,
        body: null,
        actor: row.assigneeUserId
          ? (actors.get(row.assigneeUserId) ?? null)
          : null,
        activityId: null,
        editedAt: null,
        isDeleted: false,
      })),

    ...historyRows.flatMap((row): TimelineEntry[] => {
      const occurredAt = row.effectiveAt.toISOString()
      const actor = row.actorUserId
        ? (actors.get(row.actorUserId) ?? null)
        : null
      // One history row can carry both a stage move and a status change, and
      // they are separate facts: showing them as one line would force the
      // reader to guess which of the two the reason belonged to.
      const stageMoved = row.fromStage !== null && row.fromStage !== row.toStage
      const statusChanged =
        row.fromStatus !== null && row.fromStatus !== row.toStatus

      return [
        ...(stageMoved
          ? [
              {
                id: `stage:${row.sequence}`,
                kind: 'stage_changed' as const,
                occurredAt,
                summary: `moved the stage to ${stageLabel(pipeline, row.toStage ?? '')}`,
                body: row.reason,
                actor,
                activityId: null,
                editedAt: null,
                isDeleted: false,
              },
            ]
          : []),
        ...(statusChanged
          ? [
              {
                id: `status:${row.sequence}`,
                kind: 'status_changed' as const,
                occurredAt,
                summary: `set the status to ${statusLabels[row.toStatus]}`,
                body: stageMoved ? null : row.reason,
                actor,
                activityId: null,
                editedAt: null,
                isDeleted: false,
              },
            ]
          : []),
        ...(row.fromStatus === null
          ? [
              {
                id: `opened:${row.sequence}`,
                kind: 'status_changed' as const,
                occurredAt,
                summary: 'opened the case',
                body: null,
                actor,
                activityId: null,
                editedAt: null,
                isDeleted: false,
              },
            ]
          : []),
      ]
    }),

    // The opening assignment is skipped: "opened the case" already covers it,
    // and two entries at the same second read as something happening twice.
    ...assignmentRows
      .filter((row) => row.reason !== null || row.assignedByUserId !== null)
      .map((row) => ({
        id: `assignment:${row.id}`,
        kind: 'assignment' as const,
        occurredAt: row.validFrom.toISOString(),
        summary: `assigned to ${
          row.ownerUserId
            ? (actors.get(row.ownerUserId)?.displayName ?? 'someone')
            : 'nobody'
        }`,
        body: row.reason,
        actor: row.assignedByUserId
          ? (actors.get(row.assignedByUserId) ?? null)
          : null,
        activityId: null,
        editedAt: null,
        isDeleted: false,
      })),

    ...(caseRow?.decidedAt
      ? [
          {
            id: `decision:${caseRow.id}`,
            kind: 'decision' as const,
            occurredAt: caseRow.decidedAt.toISOString(),
            summary: `recorded the decision: ${caseRow.decision}`,
            body: caseRow.decisionReason,
            actor: caseRow.decidedByUserId
              ? (actors.get(caseRow.decidedByUserId) ?? null)
              : null,
            activityId: null,
            editedAt: null,
            isDeleted: false,
          },
        ]
      : []),

    ...(caseRow?.integrationStage
      ? [
          {
            id: `integration:${caseRow.id}`,
            kind: 'stage_changed' as const,
            occurredAt: caseRow.updatedAt.toISOString(),
            summary: `integration track: ${integrationStageLabel(caseRow.integrationStage)}`,
            body: null,
            actor: null,
            activityId: null,
            editedAt: null,
            isDeleted: false,
          },
        ]
      : []),
  ]

  return entries.sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt)
  )
}
