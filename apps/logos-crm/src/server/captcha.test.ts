import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { readClientIp, verifyCaptcha } from './captcha'

const ORIGINAL_SECRET = process.env.HCAPTCHA_SECRET

function mockVerifier(response: {
  ok?: boolean
  body?: unknown
  reject?: boolean
}) {
  const fetchMock = vi.fn(async () => {
    if (response.reject) throw new Error('network down')
    return {
      ok: response.ok ?? true,
      json: async () => response.body ?? { success: true },
    } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('intake captcha', () => {
  beforeEach(() => {
    process.env.HCAPTCHA_SECRET = 'test-secret'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    if (ORIGINAL_SECRET === undefined) delete process.env.HCAPTCHA_SECRET
    else process.env.HCAPTCHA_SECRET = ORIGINAL_SECRET
  })

  test('skips verification when no secret is configured', async () => {
    delete process.env.HCAPTCHA_SECRET
    const fetchMock = mockVerifier({})

    const outcome = await verifyCaptcha(undefined, null)

    expect(outcome).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('fails closed instead of skipping when production has no secret', async () => {
    delete process.env.HCAPTCHA_SECRET
    vi.stubEnv('NODE_ENV', 'production')

    // Skipping here would leave the one public endpoint unprotected while
    // looking protected, which is the failure this check exists to prevent.
    expect(await verifyCaptcha('token', null)).toEqual({
      ok: false,
      reason: 'not_configured',
    })
  })

  test('rejects a missing token once a secret is configured', async () => {
    const fetchMock = mockVerifier({})

    const outcome = await verifyCaptcha(undefined, null)

    expect(outcome).toEqual({ ok: false, reason: 'missing_token' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('accepts a token the verifier confirms', async () => {
    mockVerifier({ body: { success: true } })

    const outcome = await verifyCaptcha('token', '203.0.113.7')

    expect(outcome).toEqual({ ok: true, skipped: false })
  })

  test('rejects a token the verifier refuses', async () => {
    mockVerifier({ body: { success: false } })

    const outcome = await verifyCaptcha('token', null)

    expect(outcome).toEqual({ ok: false, reason: 'rejected' })
  })

  test('reports a verifier outage as unavailable, not as a rejection', async () => {
    mockVerifier({ reject: true })

    const outcome = await verifyCaptcha('token', null)

    expect(outcome).toEqual({ ok: false, reason: 'unavailable' })
  })

  test('treats a non-200 from the verifier as unavailable', async () => {
    mockVerifier({ ok: false })

    const outcome = await verifyCaptcha('token', null)

    expect(outcome).toEqual({ ok: false, reason: 'unavailable' })
  })

  test('never sends the secret anywhere but the verifier', async () => {
    const fetchMock = mockVerifier({ body: { success: true } })

    await verifyCaptcha('token', null)

    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toBe('https://api.hcaptcha.com/siteverify')
  })
})

describe('client ip', () => {
  test('prefers the first forwarded address', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.7, 198.51.100.2' },
    })

    expect(readClientIp(request)).toBe('203.0.113.7')
  })

  test('falls back to x-real-ip', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-real-ip': '198.51.100.2' },
    })

    expect(readClientIp(request)).toBe('198.51.100.2')
  })

  test('returns null when the proxy sent nothing', () => {
    expect(readClientIp(new Request('https://example.test'))).toBeNull()
  })
})
