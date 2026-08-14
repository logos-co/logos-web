import { desc, eq } from 'drizzle-orm'

import { intakeSubmissionSchema } from '@/contracts/intake'
import type { MappedNotionPage, NotionPage } from '@/contracts/notion'
import { mapNotionPage } from '@/contracts/notion'
import { db } from '@/server/db'
import { importErrors, importRuns } from '@/server/db/schema'
import { processSubmission, recordSubmission } from '@/server/intake-repository'

export const NOTION_SOURCE_SYSTEM = 'notion'

export interface NotionImportSummary {
  runId: string
  created: number
  duplicates: number
  errors: number
  watermark: Date | null
}

/** Supplies pages; the real client in production, a fixture in tests. */
export type NotionPageSource = (
  cursor: string | null
) => Promise<{ pages: NotionPage[]; nextCursor: string | null }>

function toSubmissionInput(page: MappedNotionPage) {
  return intakeSubmissionSchema.parse({
    // The Notion page id is the idempotency key, so re-importing the same page
    // updates nothing rather than creating a second case for one applicant.
    submissionId: `notion:${page.pageId}`,
    formName: page.formName,
    name: page.name,
    email: page.email,
    city: page.city,
    country: page.country,
    skills: page.skills,
    affiliatedOrgs: page.affiliatedOrgs,
    website: page.website,
    chat: page.chat,
    hearAbout: page.hearAbout,
    techVision: page.techVision,
    activitiesVision: page.activitiesVision,
    wantsNewsletter: page.wantsNewsletter,
    wantsEvents: page.wantsEvents,
  })
}

/**
 * Returns the newest source timestamp a completed run has seen, so the next run
 * picks up from there instead of re-reading the whole database.
 */
export async function getLastWatermark(): Promise<Date | null> {
  const [run] = await db
    .select({ watermark: importRuns.watermark })
    .from(importRuns)
    .where(eq(importRuns.sourceSystem, NOTION_SOURCE_SYSTEM))
    .orderBy(desc(importRuns.startedAt))
    .limit(1)

  return run?.watermark ?? null
}

/**
 * Imports the Notion bridge period.
 *
 * Every page becomes a record through the same pipeline the public funnel uses,
 * so an imported applicant and a submitted one are the same kind of record. The
 * history it writes is marked as imported, which keeps these cases out of
 * duration metrics: a Notion timestamp records when somebody edited a page, not
 * when a decision was made.
 *
 * A page that fails to map is recorded as a row-level error and the run
 * continues. One malformed page must not stop the other four hundred.
 */
export async function importFromNotion(
  source: NotionPageSource
): Promise<NotionImportSummary> {
  const [run] = await db
    .insert(importRuns)
    .values({ sourceSystem: NOTION_SOURCE_SYSTEM })
    .returning()

  if (!run) throw new Error('The import run was not created.')

  let created = 0
  let duplicates = 0
  let errors = 0
  let watermark: Date | null = null
  let cursor: string | null = null

  try {
    do {
      const batch = await source(cursor)
      cursor = batch.nextCursor

      for (const page of batch.pages) {
        const mapped = mapNotionPage(page)

        if (!mapped) {
          errors += 1
          await db.insert(importErrors).values({
            runId: run.id,
            sourceId: page.id,
            message: 'The page has no name and cannot become a record.',
          })
          continue
        }

        try {
          const input = toSubmissionInput(mapped)
          const submission = await recordSubmission(input, page)
          const result = await processSubmission(
            submission,
            input,
            `import:${run.id}`,
            {
              sourceSystem: NOTION_SOURCE_SYSTEM,
              changeSource: 'import',
            }
          )

          if (result.duplicate) duplicates += 1
          else created += 1
        } catch (error) {
          errors += 1
          await db.insert(importErrors).values({
            runId: run.id,
            sourceId: page.id,
            message:
              error instanceof Error ? error.message.slice(0, 500) : 'Unknown',
          })
          continue
        }

        if (mapped.lastEditedAt) {
          const edited = new Date(mapped.lastEditedAt)
          if (!watermark || edited > watermark) watermark = edited
        }
      }
    } while (cursor)

    await db
      .update(importRuns)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        createdCount: created,
        duplicateCount: duplicates,
        errorCount: errors,
        watermark,
      })
      .where(eq(importRuns.id, run.id))
  } catch (error) {
    // The run is marked failed and keeps its counts, so a partial import is
    // visible rather than looking like it never happened.
    await db
      .update(importRuns)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        createdCount: created,
        duplicateCount: duplicates,
        errorCount: errors,
        watermark,
      })
      .where(eq(importRuns.id, run.id))
    throw error
  }

  return { runId: run.id, created, duplicates, errors, watermark }
}
