import {
  buildNotionProperties,
  resolveOrganizationSelect,
} from './build-notion-properties'

const NOTION_API_VERSION = '2026-03-11'

type NotionSelectProperty = {
  type: 'select'
  select: { options: { name: string }[] }
}

type NotionDatabaseResponse = {
  properties?: Record<string, NotionSelectProperty | { type: string }>
}

function notionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_API_VERSION,
  }
}

async function fetchOrganizationOptions(
  databaseId: string,
  token: string
): Promise<string[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: notionHeaders(token),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Notion database GET (${res.status}): ${text.slice(0, 200)}`
    )
  }

  const json = (await res.json()) as NotionDatabaseResponse
  const organization = json.properties?.Organization
  if (!organization || organization.type !== 'select') {
    return []
  }

  const selectProp = organization as NotionSelectProperty
  return selectProp.select.options.map((option) => option.name)
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
    const organizationOptions = await fetchOrganizationOptions(
      databaseId,
      token
    )
    const organizationSelect = resolveOrganizationSelect(
      typeof formData.affiliatedOrgs === 'string'
        ? formData.affiliatedOrgs
        : String(formData.affiliatedOrgs ?? ''),
      organizationOptions
    )

    const properties = buildNotionProperties(
      formData,
      formName,
      organizationSelect
    )

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionHeaders(token),
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: 'Scorecard' } }],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                { type: 'text', text: { content: 'Commitment & Reliability:' } },
              ],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: 'Facilitation & Distributed Leadership:' },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                { type: 'text', text: { content: 'Execution Ability:' } },
              ],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: 'Relevant Skills/Experience:' },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                { type: 'text', text: { content: '⇒ Overall Fit:' } },
              ],
            },
          },
        ],
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
