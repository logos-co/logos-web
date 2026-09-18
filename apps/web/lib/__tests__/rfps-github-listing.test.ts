import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchRfpMarkdownEntryForTest,
  fetchRfpListingForTest,
  parseJsDelivrRfpListingForTest,
} from '@/lib/rfps-github'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
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

describe('fetchRfpMarkdownEntry', () => {
  it('does not send the GitHub token to a public mirror download URL', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'github-token')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('# Mirror RFP'))

    await expect(
      fetchRfpMarkdownEntryForTest({
        name: 'RFP-001-admin-authority-lib.md',
        download_url:
          'https://cdn.jsdelivr.net/gh/logos-co/rfp@master/RFPs/RFP-001-admin-authority-lib.md',
        html_url:
          'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-001-admin-authority-lib.md',
        git_url: null,
      })
    ).resolves.toBe('# Mirror RFP')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cdn.jsdelivr.net/gh/logos-co/rfp@master/RFPs/RFP-001-admin-authority-lib.md',
      { headers: { 'User-Agent': 'logos-web-build' } }
    )
  })

  it('uses the public mirror after GitHub content endpoints fail', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'github-token')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))
      .mockResolvedValueOnce(new Response('# Mirror RFP'))

    await expect(
      fetchRfpMarkdownEntryForTest({
        name: 'RFP-001-admin-authority-lib.md',
        download_url:
          'https://raw.githubusercontent.com/logos-co/rfp/master/RFPs/RFP-001-admin-authority-lib.md',
        html_url:
          'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-001-admin-authority-lib.md',
        git_url: 'https://api.github.com/repos/logos-co/rfp/git/blobs/example',
      })
    ).resolves.toBe('# Mirror RFP')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      headers: { 'User-Agent': 'logos-web-build' },
    })
    expect(fetchMock.mock.calls[1]?.[1]).toEqual({
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: 'token github-token',
        'User-Agent': 'logos-web-build',
      },
    })
    expect(fetchMock.mock.calls[2]).toEqual([
      'https://cdn.jsdelivr.net/gh/logos-co/rfp@master/RFPs/RFP-001-admin-authority-lib.md',
      { headers: { 'User-Agent': 'logos-web-build' } },
    ])
  })
})
