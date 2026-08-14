import type { NotionPage } from '@/contracts/notion'

import { getServerEnv } from './env'

const NOTION_API_BASE_URL = 'https://api.notion.com/v1'
const NOTION_API_VERSION = '2026-03-11'
const PAGE_SIZE = 100

export interface NotionQueryPage {
  pages: NotionPage[]
  nextCursor: string | null
}

export interface NotionQueryOptions {
  /** Only pages edited at or after this instant, so a re-run is incremental. */
  since?: Date | null
  cursor?: string | null
}

/**
 * Reads the bridge-period database through the Notion API rather than a manual
 * CSV export, so the import can be re-run and reconciled instead of being a
 * one-shot someone has to remember how they did.
 */
export async function queryIntakeDatabase(
  options: Readonly<NotionQueryOptions> = {}
): Promise<NotionQueryPage> {
  const env = getServerEnv()
  if (!env.NOTION_TOKEN || !env.NOTION_INTAKE_DATABASE_ID) {
    throw new Error(
      'NOTION_TOKEN and NOTION_INTAKE_DATABASE_ID must be set to run the bridge import.'
    )
  }

  const body: Record<string, unknown> = {
    page_size: PAGE_SIZE,
    // Oldest first, so a run interrupted halfway leaves a usable watermark
    // rather than a hole in the middle of the period.
    sorts: [{ timestamp: 'last_edited_time', direction: 'ascending' }],
    ...(options.cursor ? { start_cursor: options.cursor } : {}),
    ...(options.since
      ? {
          filter: {
            timestamp: 'last_edited_time',
            last_edited_time: { on_or_after: options.since.toISOString() },
          },
        }
      : {}),
  }

  const response = await fetch(
    `${NOTION_API_BASE_URL}/databases/${env.NOTION_INTAKE_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    // The status is enough to act on; the body can echo page content, which is
    // personal data and does not belong in a log line.
    throw new Error(`Notion query failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as {
    results?: NotionPage[]
    next_cursor?: string | null
    has_more?: boolean
  }

  return {
    pages: payload.results ?? [],
    nextCursor: payload.has_more ? (payload.next_cursor ?? null) : null,
  }
}
