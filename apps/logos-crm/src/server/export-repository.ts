import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { and, asc, eq, lt, sql } from 'drizzle-orm'

import type { CreateExportInput, ExportJobRecord } from '@/contracts/export'
import { EXPORT_RETENTION_HOURS } from '@/contracts/export'
import type { CaseListFilters } from '@/server/case-repository'
import { listCases } from '@/server/case-repository'
import { recordAuditEvent, systemActor } from '@/server/audit'
import type { ActorContext } from '@/server/auth'
import { toCsv } from '@/server/csv'
import { db } from '@/server/db'
import { exportJobs } from '@/server/db/schema'
import { getServerEnv } from '@/server/env'
import { getFunnelReport } from '@/server/report-repository'
import { notFound } from '@/server/service-errors'

function exportDirectory(): string {
  return getServerEnv().EXPORT_DIR ?? path.join(process.cwd(), '.exports')
}

function toRecord(row: typeof exportJobs.$inferSelect): ExportJobRecord {
  return {
    id: row.id,
    resource: row.resource as ExportJobRecord['resource'],
    status: row.status as ExportJobRecord['status'],
    rowCount: row.rowCount,
    requestedAt: row.requestedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    error: row.error,
  }
}

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

    // Enqueued in the same transaction, so a job can never exist for a request
    // that was rolled back.
    await transaction.execute(sql`
      select graphile_worker.add_job(
        'generate_export',
        payload => ${JSON.stringify({ exportId: created.id })}::json,
        max_attempts => 3,
        job_key => ${`export:${created.id}`}
      )
    `)

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

export async function readExportFile(
  id: string
): Promise<{ filePath: string; resource: string }> {
  const [row] = await db
    .select()
    .from(exportJobs)
    .where(eq(exportJobs.id, id))
    .limit(1)

  if (!row || !row.filePath) throw notFound('The export is not ready.')
  if (row.status !== 'completed') throw notFound('The export is not ready.')
  // Expiry is enforced on read as well as by the cleanup job: a file that
  // outlived its window must not be downloadable just because the job has not
  // run yet.
  if (row.expiresAt && row.expiresAt < new Date()) {
    throw notFound('The export has expired.')
  }

  return { filePath: row.filePath, resource: row.resource }
}

/**
 * Builds the file for a requested export.
 *
 * Rows come from the same queries the screens use, with the filters that were
 * stored on the request. Re-implementing the query here is how an export and
 * the page it came from start disagreeing about what they contain.
 */
export async function generateExport(exportId: string): Promise<number> {
  const [job] = await db
    .select()
    .from(exportJobs)
    .where(eq(exportJobs.id, exportId))
    .limit(1)

  if (!job) throw notFound('The export no longer exists.')
  if (job.status === 'completed') return job.rowCount ?? 0

  await db
    .update(exportJobs)
    .set({ status: 'running' })
    .where(eq(exportJobs.id, exportId))

  try {
    const rows = await buildRows(job)
    const directory = exportDirectory()
    await mkdir(directory, { recursive: true })

    const filePath = path.join(directory, `${exportId}.csv`)
    await writeFile(filePath, toCsv(rows), 'utf8')

    await db
      .update(exportJobs)
      .set({
        status: 'completed',
        rowCount: rows.length,
        filePath,
        completedAt: new Date(),
        expiresAt: new Date(
          Date.now() + EXPORT_RETENTION_HOURS * 60 * 60 * 1000
        ),
        error: null,
      })
      .where(eq(exportJobs.id, exportId))

    return rows.length
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

/**
 * Deletes files past their retention window and marks the rows expired. The
 * row stays: who asked for an extract of personal data outlives the extract.
 */
export async function expireExports(requestId: string): Promise<number> {
  const due = await db
    .select()
    .from(exportJobs)
    .where(
      and(
        eq(exportJobs.status, 'completed'),
        lt(exportJobs.expiresAt, new Date())
      )
    )
    .orderBy(asc(exportJobs.expiresAt))

  for (const job of due) {
    if (job.filePath) {
      // A file already gone is the desired end state, not an error.
      await unlink(job.filePath).catch(() => undefined)
    }

    await db.transaction(async (transaction) => {
      await transaction
        .update(exportJobs)
        .set({ status: 'expired', filePath: null })
        .where(eq(exportJobs.id, job.id))

      await recordAuditEvent(transaction, systemActor(requestId), {
        action: 'export.expired',
        entityType: 'case',
        entityId: job.id,
      })
    })
  }

  return due.length
}
