import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import { exportJobs } from '@/server/db/schema'
import {
  expireExports,
  generateExport,
  readExportFile,
  requestExport,
} from '@/server/export-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

describe.skipIf(!isIntegrationEnabled)('csv export', () => {
  let actor: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    await db.execute(sql`delete from graphile_worker._private_jobs`)
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

  async function openCase(title: string) {
    return createCase(actor, {
      title,
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
  }

  test('queues a job in the same transaction as the request', async () => {
    const job = await requestExport(actor, {
      resource: 'cases',
      filters: {},
    })

    const queued = await db.execute<{ count: number }>(
      sql`select count(*)::int as count from graphile_worker.jobs where task_identifier = 'generate_export'`
    )

    expect(job.status).toBe('pending')
    expect(Number(queued.rows[0]?.count ?? 0)).toBe(1)
  })

  test('writes a row per case with the filters that were requested', async () => {
    await openCase('Protocol research partnership')
    await openCase('Community node programme')

    const job = await requestExport(actor, {
      resource: 'cases',
      filters: { q: 'protocol' },
    })
    const rows = await generateExport(job.id)

    const { filePath } = await readExportFile(job.id)
    const contents = await readFile(filePath, 'utf8')

    // The same filter the screen would apply, applied once.
    expect(rows).toBe(1)
    expect(contents).toContain('Protocol research partnership')
    expect(contents).not.toContain('Community node programme')
  })

  test('starts the file with a BOM and a header row', async () => {
    await openCase('Protocol research partnership')
    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    await generateExport(job.id)

    const { filePath } = await readExportFile(job.id)
    const contents = await readFile(filePath, 'utf8')

    expect(contents.startsWith('\uFEFF')).toBe(true)
    expect(contents).toContain('title,organisation,owner')
  })

  test('exports the report with one labelled row per measured bucket', async () => {
    await openCase('Protocol research partnership')

    const job = await requestExport(actor, {
      resource: 'report_funnel',
      filters: {
        cohortFrom: new Date(Date.now() - 30 * 86_400_000).toISOString(),
        cohortTo: new Date().toISOString(),
        asOf: new Date().toISOString(),
        timezone: 'UTC',
        bucket: 'day',
      },
    })
    await generateExport(job.id)

    const { filePath } = await readExportFile(job.id)
    const contents = await readFile(filePath, 'utf8')

    expect(contents).toContain('section,key,label,count')
    expect(contents).toContain('cohort,total')
    expect(contents).toContain('status,new')
  })

  test('records the row count and an expiry when it completes', async () => {
    await openCase('Protocol research partnership')
    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    await generateExport(job.id)

    const [row] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, job.id))

    expect(row?.status).toBe('completed')
    expect(row?.rowCount).toBe(1)
    expect(row?.expiresAt).not.toBeNull()
  })

  test('refuses to serve a file that has expired', async () => {
    await openCase('Protocol research partnership')
    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    await generateExport(job.id)

    await db
      .update(exportJobs)
      .set({ expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(exportJobs.id, job.id))

    // Enforced on read as well as by the cleanup job, so a file cannot be
    // downloaded just because the job has not run yet.
    await expect(readExportFile(job.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  test('deletes expired files but keeps the record of who asked', async () => {
    await openCase('Protocol research partnership')
    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    await generateExport(job.id)

    const { filePath } = await readExportFile(job.id)
    await db
      .update(exportJobs)
      .set({ expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(exportJobs.id, job.id))

    const expired = await expireExports('test')

    const [row] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, job.id))

    expect(expired).toBe(1)
    expect(row?.status).toBe('expired')
    expect(row?.filePath).toBeNull()
    expect(row?.requestedByUserId).toBe(actor.userId)
    await expect(readFile(filePath, 'utf8')).rejects.toThrow()
    expect(path.basename(filePath)).toBe(`${job.id}.csv`)
  })

  test('leaves a file that has not expired alone', async () => {
    await openCase('Protocol research partnership')
    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    await generateExport(job.id)

    expect(await expireExports('test')).toBe(0)
  })

  test('is idempotent if the job runs twice', async () => {
    await openCase('Protocol research partnership')
    const job = await requestExport(actor, { resource: 'cases', filters: {} })

    expect(await generateExport(job.id)).toBe(1)
    expect(await generateExport(job.id)).toBe(1)
  })
})
