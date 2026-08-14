import { eq } from 'drizzle-orm'

import type { CreateExportInput, ExportJobRecord } from '@/contracts/export'
import type { CaseListFilters } from '@/server/case-repository'
import { listCases } from '@/server/case-repository'
import { recordAuditEvent } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { toCsv } from '@/server/csv'
import { db } from '@/server/db'
import { exportJobs } from '@/server/db/schema'
import { getFunnelReport } from '@/server/report-repository'
import { notFound } from '@/server/service-errors'

function toRecord(row: typeof exportJobs.$inferSelect): ExportJobRecord {
  return {
    id: row.id,
    resource: row.resource as ExportJobRecord['resource'],
    status: row.status as ExportJobRecord['status'],
    rowCount: row.rowCount,
    requestedAt: row.requestedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    error: row.error,
  }
}

/**
 * Records a request for an extract.
 *
 * The row is the point of this call. Who asked for an extract of personal
 * data, with which filters, and when is a fact worth keeping long after the
 * file itself is irrelevant, so it is written before anything is produced and
 * it outlives the download.
 */
export async function requestExport(
  actor: Readonly<ActorContext>,
  input: Readonly<CreateExportInput>
): Promise<ExportJobRecord> {
  const row = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(exportJobs)
      .values({
        resource: input.resource,
        filters: input.filters,
        requestedByUserId: actor.userId,
      })
      .returning()

    if (!created) throw new Error('The export was not requested.')

    // Requesting an extract of personal data is itself worth recording.
    await recordAuditEvent(transaction, actor, {
      action: 'export.requested',
      entityType: 'case',
      entityId: created.id,
      summary: input.resource,
    })

    return created
  })

  return toRecord(row)
}

export async function getExport(id: string): Promise<ExportJobRecord> {
  const [row] = await db
    .select()
    .from(exportJobs)
    .where(eq(exportJobs.id, id))
    .limit(1)

  if (!row) throw notFound('The export no longer exists.')
  return toRecord(row)
}

/**
 * Produces the extract.
 *
 * Built when it is downloaded rather than written to a file by a worker. The
 * file was a copy of personal data that had to be stored somewhere, guarded,
 * and expired on a schedule; producing it on the way out removes all three
 * problems, and it means an export works in any deployment rather than only in
 * one that has a queue and a shared volume.
 */
export async function buildExportCsv(
  exportId: string
): Promise<{ csv: string; rowCount: number; resource: string }> {
  const [job] = await db
    .select()
    .from(exportJobs)
    .where(eq(exportJobs.id, exportId))
    .limit(1)

  if (!job) throw notFound('The export no longer exists.')

  try {
    const rows = await buildRows(job)
    const csv = toCsv(rows)

    await db
      .update(exportJobs)
      .set({
        status: 'completed',
        rowCount: rows.length,
        completedAt: new Date(),
        error: null,
      })
      .where(eq(exportJobs.id, exportId))

    return { csv, rowCount: rows.length, resource: job.resource }
  } catch (error) {
    await db
      .update(exportJobs)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Unknown',
      })
      .where(eq(exportJobs.id, exportId))
    throw error
  }
}

async function buildRows(
  job: typeof exportJobs.$inferSelect
): Promise<Record<string, unknown>[]> {
  if (job.resource === 'cases') {
    const filters = job.filters as CaseListFilters
    const items = await listCases(filters, job.requestedByUserId)

    return items.map((item) => ({
      title: item.title,
      organisation: item.organisationName ?? '',
      owner: item.owner?.displayName ?? 'Unassigned',
      status: item.status,
      stage: item.stage,
      priority: item.priority,
      decision: item.decision,
      lead_source: item.leadSource ?? '',
      profile: item.profile ?? '',
      next_action: item.nextTask?.title ?? '',
      next_action_due: item.nextTask?.dueAt ?? '',
      last_contact: item.lastContactAt ?? '',
      created_at: item.createdAt,
    }))
  }

  const report = await getFunnelReport(
    job.filters as Parameters<typeof getFunnelReport>[0]
  )

  // One tidy row per measured bucket, so the file says what each number is
  // rather than assuming the reader remembers the chart.
  return [
    {
      section: 'cohort',
      key: 'total',
      label: 'Cohort total',
      count: report.cohortTotal,
    },
    {
      section: 'cohort',
      key: 'history_coverage_gap',
      label: 'Imported without observed history',
      count: report.historyCoverageGap,
    },
    ...report.statusAtAsOf.map((item) => ({ section: 'status', ...item })),
    ...report.decisions.map((item) => ({ section: 'decision', ...item })),
    ...report.ownersAtAsOf.map((item) => ({ section: 'owner', ...item })),
    ...report.intakeOverTime.map((item) => ({ section: 'intake', ...item })),
  ]
}
