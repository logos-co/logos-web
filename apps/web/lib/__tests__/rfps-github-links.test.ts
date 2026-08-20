import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchRfpMarkdownEntryForTest,
  rewriteRfpMarkdownLinks,
} from '@/lib/rfps-github'

const FILE_URL =
  'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-016-lbp-launchpad.md'

describe('rewriteRfpMarkdownLinks', () => {
  it('rewrites sibling RFP cross-references to internal detail routes', () => {
    const md = 'See [LBP](./RFP-008-lending-borrowing-protocol.md) for context.'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(
      'See [LBP](/builders-hub/rfps/lending-borrowing-protocol) for context.'
    )
  })

  it('rewrites RFP references without a leading ./', () => {
    const md = '[admin](RFP-001-admin-authority-lib.md)'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(
      '[admin](/builders-hub/rfps/admin-authority-lib)'
    )
  })

  it('resolves other repo-relative .md links to absolute GitHub URLs, keeping anchors', () => {
    const md = '[fees](../appendix/token-launchpad-ecosystem.md#fee-structures)'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(
      '[fees](https://github.com/logos-co/rfp/blob/master/appendix/token-launchpad-ecosystem.md#fee-structures)'
    )
  })

  it('leaves external, absolute, and anchor links unchanged', () => {
    const md = [
      '[ext](https://github.com/logos-co/lambda-prize/blob/master/prizes/LP-0004.md)',
      '[abs](/builders-hub/rfps)',
      '[frag](#overview)',
    ].join('\n')

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(md)
  })

  it('leaves relative non-markdown links untouched', () => {
    const md = '![diagram](./images/flow.png)'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(md)
  })
})

describe('fetchRfpMarkdownEntryForTest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back from download_url to raw GitHub URL without retrying a 404', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(
        new Response('# RFP raw markdown', { status: 200 })
      )

    const result = await fetchRfpMarkdownEntryForTest({
      name: 'RFP-001-example.md',
      download_url: 'https://objects.githubusercontent.com/RFP-001-example.md',
      html_url:
        'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-001-example.md',
      git_url: 'https://api.github.com/repos/logos-co/rfp/git/blobs/example',
    })

    expect(result).toBe('# RFP raw markdown')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://raw.githubusercontent.com/logos-co/rfp/master/RFPs/RFP-001-example.md'
    )
  })

  it('retries a rate-limited response before falling back to the next URL', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('rate limited', { status: 403 }))
      .mockResolvedValueOnce(new Response('rate limited', { status: 403 }))
      .mockResolvedValueOnce(
        new Response('# RFP retried markdown', { status: 200 })
      )

    const pending = fetchRfpMarkdownEntryForTest({
      name: 'RFP-003-example.md',
      download_url: 'https://objects.githubusercontent.com/RFP-003-example.md',
      html_url:
        'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-003-example.md',
      git_url: null,
    })
    await vi.runAllTimersAsync()
    const result = await pending

    expect(result).toBe('# RFP retried markdown')
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      'https://objects.githubusercontent.com/RFP-003-example.md'
    )
    vi.useRealTimers()
  })

  it('decodes GitHub blob content when raw URL fetches fail', async () => {
    const encoded = Buffer.from('# RFP blob markdown', 'utf8').toString(
      'base64'
    )
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(
        Response.json({ content: encoded, encoding: 'base64' })
      )

    const result = await fetchRfpMarkdownEntryForTest({
      name: 'RFP-002-example.md',
      download_url: 'https://objects.githubusercontent.com/RFP-002-example.md',
      html_url:
        'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-002-example.md',
      git_url: 'https://api.github.com/repos/logos-co/rfp/git/blobs/example',
    })

    expect(result).toBe('# RFP blob markdown')
  })
})
