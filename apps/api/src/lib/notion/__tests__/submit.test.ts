import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NOTION_API_BASE_URL } from '../constants'
import { submitToNotion } from '../submit'

const TOKEN = 'secret-token'
const DB_ID = 'db-123'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

describe('submitToNotion', () => {
  beforeEach(() => {
    process.env.NOTION_API_TOKEN = TOKEN
    process.env.NOTION_DB_ID = DB_ID
    delete process.env.NOTION_DATA_SOURCE_ID
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    delete process.env.NOTION_DATA_SOURCE_ID
  })

  it('writes to the pinned data source without a databases lookup', async () => {
    process.env.NOTION_DATA_SOURCE_ID = 'ds-pinned'
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'page-1' }, true, 200))

    const result = await submitToNotion({}, 'afformActivistBuilder')

    expect(result).toEqual({ ok: true })

    // No GET /v1/databases — the data source is pinned via env.
    const urls = fetchMock.mock.calls.map((c) => c[0])
    expect(urls.some((u) => String(u).includes('/v1/databases/'))).toBe(false)
    expect(urls[0]).toBe(`${NOTION_API_BASE_URL}/pages`)

    const pageBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(pageBody.parent).toEqual({
      type: 'data_source_id',
      data_source_id: 'ds-pinned',
    })
  })

  it('falls back to the sole data source when none is pinned', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data_sources: [{ id: 'ds-only', name: 'IFT BD CRM' }] })
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'page-1' }))

    const result = await submitToNotion({}, 'afformActivistBuilder')

    expect(result).toEqual({ ok: true })
    const pageBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
    expect(pageBody.parent).toEqual({
      type: 'data_source_id',
      data_source_id: 'ds-only',
    })
  })

  it('errors when the database has multiple data sources and none is pinned', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data_sources: [
          { id: 'ds-a', name: 'IFT BD CRM' },
          { id: 'ds-b', name: 'New data source' },
        ],
      })
    )

    const result = await submitToNotion({}, 'afformActivistBuilder')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('NOTION_DATA_SOURCE_ID')
    }
    // No page creation attempted.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns not-configured when token or database id is missing', async () => {
    delete process.env.NOTION_DB_ID
    const result = await submitToNotion({}, 'afformActivistBuilder')
    expect(result).toEqual({ ok: false, message: 'Notion is not configured' })
  })
})
