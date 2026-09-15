import { buildNotionProperties } from './build-notion-properties'
import { NOTION_API_BASE_URL, NOTION_API_VERSION } from './constants'
import { EVALUATION_TEMPLATE_CHILDREN } from './evaluation-template'

type NotionDatabaseResponse = {
  data_sources?: { id: string; name: string }[]
}

function notionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_API_VERSION,
  }
}

// Since Notion API 2025-09-03 a database is a container that can hold multiple
// data sources, and pages must be addressed by data source rather than by
// database. We pin writes to a single data source: NOTION_DATA_SOURCE_ID takes
// precedence; otherwise we fall back to the database's sole data source. A
// database with multiple sources and no pin is ambiguous and errors out.
async function resolveDataSourceId(
  databaseId: string,
  token: string
): Promise<string> {
  const pinned = process.env.NOTION_DATA_SOURCE_ID?.trim()
  if (pinned) {
    return pinned
  }

  const res = await fetch(`${NOTION_API_BASE_URL}/databases/${databaseId}`, {
    headers: notionHeaders(token),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Notion database GET (${res.status}): ${text.slice(0, 200)}`
    )
  }

  const json = (await res.json()) as NotionDatabaseResponse
  const sources = json.data_sources ?? []
  if (sources.length === 1) {
    return sources[0].id
  }
  if (sources.length === 0) {
    throw new Error('Notion database has no data sources')
  }

  throw new Error(
    'Notion database has multiple data sources; set NOTION_DATA_SOURCE_ID to pin one'
  )
}

export type NotionSubmitResult =
  | { ok: true }
  | { ok: false; message: string }

export async function submitToNotion(
  formData: Record<string, unknown>,
  formName: string
): Promise<NotionSubmitResult> {
  const token = process.env.NOTION_API_TOKEN ?? ''
  const databaseId = process.env.NOTION_DB_ID ?? ''

  if (!token || !databaseId) {
    return { ok: false, message: 'Notion is not configured' }
  }

  try {
    const dataSourceId = await resolveDataSourceId(databaseId, token)
    const properties = buildNotionProperties(formData, formName)

    const res = await fetch(`${NOTION_API_BASE_URL}/pages`, {
      method: 'POST',
      headers: notionHeaders(token),
      body: JSON.stringify({
        parent: { type: 'data_source_id', data_source_id: dataSourceId },
        properties,
        children: EVALUATION_TEMPLATE_CHILDREN,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        ok: false,
        message: `Notion API (${res.status}): ${text.slice(0, 200)}`,
      }
    }

    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, message }
  }
}
