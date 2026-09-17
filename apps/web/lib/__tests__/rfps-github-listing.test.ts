import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchRfpListingForTest,
  parseJsDelivrRfpListingForTest,
} from '@/lib/rfps-github'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('parseJsDelivrRfpListing', () => {
  it('maps only direct RFP directory files to GitHub-compatible entries', () => {
    expect(
      parseJsDelivrRfpListingForTest({
        files: [
          { name: '/README.md' },
          { name: '/RFPs/RFP-001-admin-authority-lib.md' },
          { name: '/RFPs/archive/RFP-002-old.md' },
        ],
      })
    ).toEqual([
      {
        name: 'RFP-001-admin-authority-lib.md',
        download_url:
          'https://cdn.jsdelivr.net/gh/logos-co/rfp@master/RFPs/RFP-001-admin-authority-lib.md',
        html_url:
          'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-001-admin-authority-lib.md',
        git_url: null,
      },
    ])
  })

  it('rejects malformed listing responses', () => {
    expect(parseJsDelivrRfpListingForTest(null)).toBeNull()
    expect(parseJsDelivrRfpListingForTest({ files: 'invalid' })).toBeNull()
  })

  it('uses the public mirror after GitHub rate-limit retries are exhausted', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('rate limited', { status: 403 }))
      .mockResolvedValueOnce(new Response('rate limited', { status: 403 }))
      .mockResolvedValueOnce(new Response('rate limited', { status: 403 }))
      .mockResolvedValueOnce(
        Response.json({
          files: [{ name: '/RFPs/RFP-001-admin-authority-lib.md' }],
        })
      )

    const pending = fetchRfpListingForTest()
    await vi.runAllTimersAsync()
    const result = await pending

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('RFP-001-admin-authority-lib.md')
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls[3]?.[0]).toBe(
      'https://data.jsdelivr.com/v1/package/gh/logos-co/rfp@master/flat'
    )
    expect(fetchMock.mock.calls[3]?.[1]).toEqual({
      headers: { 'User-Agent': 'logos-web-build' },
    })
  })
})
