import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import { auditEvents, exportJobs } from '@/server/db/schema'
import { buildExportCsv, requestExport } from '@/server/export-repository'

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

  test('records who asked for an extract and with which filters', async () => {
    const job = await requestExport(actor, {
      resource: 'cases',
      filters: { q: 'protocol' },
    })

    const [row] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, job.id))

    expect(job.status).toBe('pending')
    expect(row?.requestedByUserId).toBe(actor.userId)
    expect(row?.filters).toEqual({ q: 'protocol' })

    // Requesting an extract of personal data is itself an audited action, and
    // the record survives the file that no longer exists.
    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, job.id))

    expect(events[0]?.action).toBe('export.requested')
  })

  test('produces a row per case with the filters that were requested', async () => {
    await openCase('Protocol research partnership')
    await openCase('Community node programme')

    const job = await requestExport(actor, {
      resource: 'cases',
      filters: { q: 'protocol' },
    })

    const { csv, rowCount } = await buildExportCsv(job.id)

    // The same filter the screen would apply, applied once.
    expect(rowCount).toBe(1)
    expect(csv).toContain('Protocol research partnership')
    expect(csv).not.toContain('Community node programme')
  })

  test('starts the file with a BOM and a header row', async () => {
    await openCase('Protocol research partnership')

    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    const { csv } = await buildExportCsv(job.id)

    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.split('\n')[0]).toContain('title')
  })

  test('marks the request completed with the number of rows it produced', async () => {
    await openCase('Protocol research partnership')

    const job = await requestExport(actor, { resource: 'cases', filters: {} })
    await buildExportCsv(job.id)

    const [row] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, job.id))

    expect(row?.status).toBe('completed')
    expect(row?.rowCount).toBe(1)
    expect(row?.completedAt).not.toBeNull()
  })

  test('exports the funnel report as one row per measured bucket', async () => {
    await openCase('Protocol research partnership')

    const now = new Date()
    const job = await requestExport(actor, {
      resource: 'report_funnel',
      filters: {
        cohortFrom: new Date(now.getTime() - 30 * 86_400_000).toISOString(),
        cohortTo: now.toISOString(),
        asOf: now.toISOString(),
        timezone: 'Europe/Zurich',
        bucket: 'week',
      },
    })

    const { csv } = await buildExportCsv(job.id)

    expect(csv).toContain('cohort')
    expect(csv).toContain('status')
    expect(csv).toContain('intake')
  })

  test('records the failure on the request rather than losing it', async () => {
    const job = await requestExport(actor, { resource: 'cases', filters: {} })

    // A filter shape the query cannot honour: the request has to end in a
    // state somebody can see, not in a promise that never resolves.
    await db
      .update(exportJobs)
      .set({ resource: 'nonsense' })
      .where(eq(exportJobs.id, job.id))

    await expect(buildExportCsv(job.id)).rejects.toThrow()

    const [row] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, job.id))

    expect(row?.status).toBe('failed')
    expect(row?.error).not.toBeNull()
  })
})
