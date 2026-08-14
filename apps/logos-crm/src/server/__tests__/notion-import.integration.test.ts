import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import { NOTION_PROPERTIES, type NotionPage } from '@/contracts/notion'
import { db } from '@/server/db'
import {
  caseWorkflowHistory,
  cases,
  externalIdentities,
  importErrors,
  importRuns,
  people,
} from '@/server/db/schema'
import { getFunnelReport } from '@/server/report-repository'
import {
  getLastWatermark,
  importFromNotion,
  NOTION_SOURCE_SYSTEM,
} from '@/server/notion-import'

import { isIntegrationEnabled, resetDatabase } from './support/database'

function notionPage(
  id: string,
  name: string,
  extra: Record<string, unknown> = {},
  lastEdited = '2026-07-01T10:00:00.000Z'
): NotionPage {
  return {
    id,
    last_edited_time: lastEdited,
    properties: {
      [NOTION_PROPERTIES.name]: { title: [{ plain_text: name }] },
      ...extra,
    },
  }
}

/** Serves a fixed set of pages in one batch, like the real client would. */
function sourceOf(pages: NotionPage[]) {
  return async () => ({ pages, nextCursor: null })
}

describe.skipIf(!isIntegrationEnabled)('notion bridge import', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  test('imports a page as a case through the intake pipeline', async () => {
    const summary = await importFromNotion(
      sourceOf([
        notionPage('page-1', 'Amina Okafor', {
          [NOTION_PROPERTIES.email]: { email: 'amina@opensystems.example' },
          [NOTION_PROPERTIES.organisation]: {
            rich_text: [{ plain_text: 'Open Systems Lab' }],
          },
        }),
      ])
    )

    const allCases = await db.select().from(cases)

    expect(summary.created).toBe(1)
    expect(allCases).toHaveLength(1)
    expect(allCases[0]?.status).toBe('new')
    expect(allCases[0]?.ownerUserId).toBeNull()
  })

  test('re-running the import does not create a second case', async () => {
    const source = sourceOf([notionPage('page-1', 'Amina Okafor')])

    const first = await importFromNotion(source)
    const second = await importFromNotion(source)

    expect(first.created).toBe(1)
    expect(second.created).toBe(0)
    expect(second.duplicates).toBe(1)
    expect(await db.select().from(cases)).toHaveLength(1)
  })

  test('keeps the Notion page id as an external identity', async () => {
    await importFromNotion(sourceOf([notionPage('page-1', 'Amina Okafor')]))

    const identities = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.sourceSystem, NOTION_SOURCE_SYSTEM))

    expect(identities).toHaveLength(1)
    expect(identities[0]?.sourceId).toBe('notion:page-1')
  })

  test('marks imported history so reports exclude it from durations', async () => {
    await importFromNotion(sourceOf([notionPage('page-1', 'Amina Okafor')]))

    const history = await db.select().from(caseWorkflowHistory)
    expect(history[0]?.source).toBe('import')

    const report = await getFunnelReport({
      cohortFrom: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      cohortTo: new Date().toISOString(),
      asOf: new Date().toISOString(),
      timezone: 'UTC',
      bucket: 'day',
    })

    expect(report.cohortTotal).toBe(1)
    expect(report.historyCoverageGap).toBe(1)
  })

  test('records a nameless page as a row error and carries on', async () => {
    const summary = await importFromNotion(
      sourceOf([
        { id: 'page-broken', properties: {} },
        notionPage('page-2', 'Leo Martin'),
      ])
    )

    const errors = await db
      .select()
      .from(importErrors)
      .where(eq(importErrors.runId, summary.runId))

    expect(summary.created).toBe(1)
    expect(summary.errors).toBe(1)
    expect(errors[0]?.sourceId).toBe('page-broken')
  })

  test('matches a returning applicant to the person already on file', async () => {
    await importFromNotion(
      sourceOf([
        notionPage('page-1', 'Amina Okafor', {
          [NOTION_PROPERTIES.email]: { email: 'amina@opensystems.example' },
        }),
      ])
    )
    await importFromNotion(
      sourceOf([
        notionPage('page-2', 'Amina Okafor', {
          [NOTION_PROPERTIES.email]: { email: 'amina@opensystems.example' },
        }),
      ])
    )

    expect(await db.select().from(people)).toHaveLength(1)
    expect(await db.select().from(cases)).toHaveLength(2)
  })

  test('carries consent through the import', async () => {
    await importFromNotion(
      sourceOf([
        notionPage('page-1', 'Amina Okafor', {
          [NOTION_PROPERTIES.email]: { email: 'amina@opensystems.example' },
          [NOTION_PROPERTIES.wantsNewsletter]: { checkbox: true },
        }),
      ])
    )

    const [person] = await db.select().from(people)

    expect(person?.consentNewsletter).toBe(true)
    expect(person?.consentEvents).toBe(false)
  })

  test('records the newest source timestamp as the next run watermark', async () => {
    await importFromNotion(
      sourceOf([
        notionPage('page-1', 'Older', {}, '2026-06-01T00:00:00.000Z'),
        notionPage('page-2', 'Newer', {}, '2026-07-15T00:00:00.000Z'),
      ])
    )

    const watermark = await getLastWatermark()

    expect(watermark?.toISOString()).toBe('2026-07-15T00:00:00.000Z')
  })

  test('completes the run with counts that match what happened', async () => {
    const summary = await importFromNotion(
      sourceOf([
        notionPage('page-1', 'Amina Okafor'),
        { id: 'page-broken', properties: {} },
      ])
    )

    const [run] = await db
      .select()
      .from(importRuns)
      .where(eq(importRuns.id, summary.runId))

    expect(run?.status).toBe('completed')
    expect(run?.createdCount).toBe(1)
    expect(run?.errorCount).toBe(1)
    expect(run?.finishedAt).not.toBeNull()
  })
})
