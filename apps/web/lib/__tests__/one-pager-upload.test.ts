import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  fetchOnePagerLinkStatus,
  ONE_PAGER_ENDPOINTS,
  ONE_PAGER_MAX_BYTES,
  submitOnePager,
  validateOnePagerFile,
} from '../one-pager-upload'

const ENDPOINT = 'https://admin-acid.logos.co/api/funnel/one-pager'
const FALLBACK = 'Something went wrong.'

function pdf(size: number, name = 'one-pager.pdf') {
  const file = new File(['x'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn(async () => responses.shift() ?? Response.json({}))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ONE_PAGER_ENDPOINTS', () => {
  test('points each API mode at its own logos-admin host', () => {
    expect(ONE_PAGER_ENDPOINTS).toEqual({
      // Kept in step with `SUBSCRIBE_ENDPOINTS`: same upstream app.
      development: 'http://localhost:3003/api/funnel/one-pager',
      staging: 'https://dev-admin-acid.logos.co/api/funnel/one-pager',
      production: ENDPOINT,
    })
  })
})

describe('validateOnePagerFile', () => {
  test('accepts a PDF within the size cap', () => {
    expect(validateOnePagerFile(pdf(1024))).toEqual({ ok: true })
  })

  test('rejects a non-PDF', () => {
    const file = new File(['x'], 'deck.png', { type: 'image/png' })
    expect(validateOnePagerFile(file)).toEqual({ ok: false, reason: 'type' })
  })

  test('rejects an empty file', () => {
    expect(validateOnePagerFile(pdf(0))).toEqual({ ok: false, reason: 'empty' })
  })

  test('rejects a file over the cap the upstream enforces', () => {
    expect(validateOnePagerFile(pdf(ONE_PAGER_MAX_BYTES + 1))).toEqual({
      ok: false,
      reason: 'size',
    })
  })
})

describe('fetchOnePagerLinkStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('asks the production endpoint with the token as a query param', async () => {
    const fetchMock = stubFetch(Response.json({ valid: true, used: false }))

    await fetchOnePagerLinkStatus('abc.def')

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${ENDPOINT}?t=abc.def`)
  })

  test('reads the valid and used flags', async () => {
    stubFetch(Response.json({ valid: true, used: false }))
    await expect(fetchOnePagerLinkStatus('t')).resolves.toBe('valid')

    stubFetch(Response.json({ valid: true, used: true }))
    await expect(fetchOnePagerLinkStatus('t')).resolves.toBe('used')

    stubFetch(Response.json({ valid: false, used: false }))
    await expect(fetchOnePagerLinkStatus('t')).resolves.toBe('invalid')
  })

  test('reports unknown rather than invalid when the check cannot be made', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('blocked by CORS')
      })
    )
    await expect(fetchOnePagerLinkStatus('t')).resolves.toBe('unknown')

    stubFetch(Response.json({}, { status: 500 }))
    await expect(fetchOnePagerLinkStatus('t')).resolves.toBe('unknown')
  })
})

describe('submitOnePager', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('posts the token and the file as multipart form data', async () => {
    const fetchMock = stubFetch(Response.json({ ok: true }))
    const file = pdf(2048)

    await expect(submitOnePager('tok', file, FALLBACK)).resolves.toEqual({
      status: 'ok',
    })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { method: string; body: FormData; headers?: HeadersInit },
    ]
    expect(url).toBe(ENDPOINT)
    expect(init.method).toBe('POST')
    // No explicit Content-Type: the browser has to set the multipart boundary.
    expect(init.headers).toBeUndefined()
    expect(init.body.get('token')).toBe('tok')
    expect(init.body.get('file')).toBe(file)
  })

  test('surfaces the upstream error message verbatim', async () => {
    stubFetch(Response.json({ error: 'This file is not a PDF.' }, { status: 400 }))

    await expect(submitOnePager('tok', pdf(1), FALLBACK)).resolves.toEqual({
      status: 'error',
      message: 'This file is not a PDF.',
    })
  })

  test('falls back to the given message when the response carries none', async () => {
    stubFetch(new Response('nope', { status: 502 }))

    await expect(submitOnePager('tok', pdf(1), FALLBACK)).resolves.toEqual({
      status: 'error',
      message: FALLBACK,
    })
  })

  test('falls back to the given message when the request never lands', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )

    await expect(submitOnePager('tok', pdf(1), FALLBACK)).resolves.toEqual({
      status: 'error',
      message: FALLBACK,
    })
  })

  test('treats a 409 on a spent link as the already-submitted state', async () => {
    stubFetch(
      Response.json({ error: 'You have already submitted your one pager.' }, { status: 409 }),
      Response.json({ valid: true, used: true })
    )

    await expect(submitOnePager('tok', pdf(1), FALLBACK)).resolves.toEqual({
      status: 'used',
    })
  })

  test('keeps a 409 for an upload in flight as a retryable error', async () => {
    stubFetch(
      Response.json({ error: 'An upload is already in progress.' }, { status: 409 }),
      Response.json({ valid: true, used: false })
    )

    await expect(submitOnePager('tok', pdf(1), FALLBACK)).resolves.toEqual({
      status: 'error',
      message: 'An upload is already in progress.',
    })
  })
})
