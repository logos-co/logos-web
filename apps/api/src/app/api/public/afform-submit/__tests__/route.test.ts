import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/notion/submit', () => ({
  submitToNotion: vi.fn(),
}))

vi.mock('@/lib/intake-submit-flags', () => ({
  isNotionIntakeSubmitEnabled: vi.fn(),
}))

vi.mock('@/lib/n8n/submit', () => ({
  submitToN8n: vi.fn(),
}))

import { POST } from '../route'
import { submitToNotion } from '@/lib/notion/submit'
import { isNotionIntakeSubmitEnabled } from '@/lib/intake-submit-flags'
import { submitToN8n } from '@/lib/n8n/submit'

// Every required answer, so a test only spells out the field it exercises.
const REQUIRED_ANSWERS: Record<string, Record<string, unknown>> = {
  afformActivistBuilder: {
    name: 'Ada',
    city: 'London',
    country: '1226',
    skills: ['1'],
    hearAbout: '2',
    backgroundBuilder: 'Protocols',
    techVision: 'Privacy by default',
    email: 'ada@example.com',
  },
  afformCoalitionPartner: {
    name: 'Ada',
    city: 'London',
    country: '1226',
    affiliatedOrgs: 'Analytical Society',
    hearAbout: '2',
    backgroundPartner: 'Coalitions',
    email: 'ada@example.com',
  },
  afformActivistLeaderSteward: {
    name: 'Ada',
    city: 'London',
    country: '1226',
    skills: ['1'],
    hearAbout: '2',
    backgroundLeader: 'Organising',
    activitiesVision: 'Local meetups',
    email: 'ada@example.com',
  },
}

function validPayload(
  formName: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return { formName, ...REQUIRED_ANSWERS[formName], ...overrides }
}

function answers(
  formName: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return { ...REQUIRED_ANSWERS[formName], ...overrides }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/public/afform-submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const DEFAULT_SITEKEY = '2ec82f0e-5f3c-45d2-ba38-223ceb5eee42'

function siteverifyBody(): URLSearchParams {
  const init = vi.mocked(fetch).mock.calls[0]?.[1]
  return init?.body as URLSearchParams
}

describe('POST /api/public/afform-submit', () => {
  beforeEach(() => {
    vi.stubEnv('HCAPTCHA_SECRET', undefined)
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(true)
    vi.mocked(submitToNotion).mockResolvedValue({ ok: true })
    vi.mocked(submitToN8n).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('accepts a funnel submission with every required answer', async () => {
    const res = await POST(makeRequest(validPayload('afformActivistBuilder')))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledWith(
      answers('afformActivistBuilder'),
      'afformActivistBuilder'
    )
  })

  it.each([
    { nodeEnv: 'production', vercelEnv: undefined, secret: undefined },
    { nodeEnv: 'development', vercelEnv: 'production', secret: '' },
    { nodeEnv: 'development', vercelEnv: 'preview', secret: '  ' },
  ])(
    'does not write when the secret is missing in $nodeEnv / $vercelEnv',
    async ({ nodeEnv, vercelEnv, secret }) => {
      vi.stubEnv('NODE_ENV', nodeEnv)
      vi.stubEnv('VERCEL_ENV', vercelEnv)
      vi.stubEnv('HCAPTCHA_SECRET', secret)

      const res = await POST(
        makeRequest(validPayload('afformActivistLeaderSteward'))
      )

      expect(res.status).toBe(503)
      expect(fetch).not.toHaveBeenCalled()
      expect(submitToNotion).not.toHaveBeenCalled()
      expect(submitToN8n).not.toHaveBeenCalled()
    }
  )

  it('requires a token when the secret is configured', async () => {
    vi.stubEnv('HCAPTCHA_SECRET', 'test-secret')
    vi.stubEnv('VERCEL_ENV', 'preview')

    const res = await POST(
      makeRequest(validPayload('afformActivistLeaderSteward'))
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Captcha token missing' })
    expect(fetch).not.toHaveBeenCalled()
    expect(submitToNotion).not.toHaveBeenCalled()
    expect(submitToN8n).not.toHaveBeenCalled()
  })

  it.each([
    { success: true, status: 201, writes: 1 },
    { success: false, status: 403, writes: 0 },
  ])(
    'verifies a token once before any writes and returns $status',
    async ({ success, status, writes }) => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('HCAPTCHA_SECRET', 'test-secret')
      vi.mocked(fetch).mockResolvedValue(
        Response.json({ success, hostname: 'logos.co' })
      )

      const res = await POST(
        makeRequest(
          validPayload('afformActivistLeaderSteward', {
            captchaToken: 'test-token',
          })
        )
      )

      expect(res.status).toBe(status)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(submitToNotion).toHaveBeenCalledTimes(writes)
      expect(submitToN8n).toHaveBeenCalledTimes(writes)
    }
  )

  describe('with a captcha secret', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('HCAPTCHA_SECRET', 'test-secret')
    })

    function submitWithToken(overrides: Record<string, unknown> = {}) {
      return POST(
        makeRequest(
          validPayload('afformActivistBuilder', {
            captchaToken: 'test-token',
            ...overrides,
          })
        )
      )
    }

    it('binds the token to the default site key', async () => {
      vi.mocked(fetch).mockResolvedValue(
        Response.json({ success: true, hostname: 'logos.co' })
      )

      const res = await submitWithToken()

      expect(res.status).toBe(201)
      expect(siteverifyBody().get('sitekey')).toBe(DEFAULT_SITEKEY)
      expect(submitToNotion).toHaveBeenCalledWith(
        answers('afformActivistBuilder'),
        'afformActivistBuilder'
      )
    })

    it('uses the site key the form sent when HCAPTCHA_SITEKEYS lists it', async () => {
      vi.stubEnv('HCAPTCHA_SITEKEYS', 'prod-key, staging-key')
      vi.mocked(fetch).mockResolvedValue(
        Response.json({ success: true, hostname: 'dev.logos.co' })
      )

      const res = await submitWithToken({ captchaSitekey: 'staging-key' })

      expect(res.status).toBe(201)
      expect(siteverifyBody().get('sitekey')).toBe('staging-key')
    })

    it('rejects a site key outside HCAPTCHA_SITEKEYS without calling hCaptcha', async () => {
      const res = await submitWithToken({ captchaSitekey: 'someone-else' })

      expect(res.status).toBe(403)
      expect(fetch).not.toHaveBeenCalled()
      expect(submitToNotion).not.toHaveBeenCalled()
    })

    it.each([
      { hostname: 'evil.example', status: 403 },
      { hostname: undefined, status: 403 },
      { hostname: 'not-provided', status: 201 },
    ])(
      'answers $status for a token solved on $hostname',
      async ({ hostname, status }) => {
        vi.mocked(fetch).mockResolvedValue(
          Response.json({ success: true, hostname })
        )

        const res = await submitWithToken()

        expect(res.status).toBe(status)
      }
    )

    it('rejects when hCaptcha does not answer', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('timeout'))

      const res = await submitWithToken()

      expect(res.status).toBe(403)
      expect(submitToNotion).not.toHaveBeenCalled()
    })
  })

  it.each([null, ['afformActivistBuilder'], 'afformActivistBuilder'])(
    'rejects the non-object body %j',
    async (body) => {
      const res = await POST(makeRequest(body))

      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Invalid request body' })
    }
  )

  it('rejects an unknown form name', async () => {
    const res = await POST(
      makeRequest(
        validPayload('afformActivistBuilder', {
          formName: 'afformCircleContactForm',
        })
      )
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid form name')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('drops the legacy field definitions from the submitted payload', async () => {
    const res = await POST(
      makeRequest(
        validPayload('afformActivistLeaderSteward', {
          fields: [{ formKey: 'name', fieldName: 'first_name' }],
        })
      )
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledWith(
      answers('afformActivistLeaderSteward'),
      'afformActivistLeaderSteward'
    )
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledWith(
      answers('afformActivistLeaderSteward'),
      'afformActivistLeaderSteward'
    )
  })

  it('rejects a funnel submission missing the hear-about answer', async () => {
    const res = await POST(
      makeRequest(validPayload('afformActivistBuilder', { hearAbout: '' }))
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or missing hear-about answer')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('rejects a funnel submission with an unknown hear-about id', async () => {
    const res = await POST(
      makeRequest(validPayload('afformActivistBuilder', { hearAbout: '999' }))
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or missing hear-about answer')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('rejects a submission missing a required field', async () => {
    const { name: _name, ...withoutName } = validPayload(
      'afformActivistBuilder'
    )

    const res = await POST(makeRequest(withoutName))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Missing or invalid required fields')
    expect(body.fields).toEqual(['name'])
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('reports every missing required field at once', async () => {
    const res = await POST(
      makeRequest(
        validPayload('afformActivistBuilder', {
          name: '   ',
          country: '',
          skills: [],
        })
      )
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.fields).toEqual(['name', 'country', 'skills'])
  })

  it('rejects a malformed email', async () => {
    const res = await POST(
      makeRequest(validPayload('afformCoalitionPartner', { email: 'ada@' }))
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.fields).toEqual(['email'])
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('applies the required fields of the submitted form only', async () => {
    // techVision is required on the builder form and absent from the partner one.
    const res = await POST(makeRequest(validPayload('afformCoalitionPartner')))

    expect(res.status).toBe(201)
  })

  it('rejects an array for a single-value field', async () => {
    const res = await POST(
      makeRequest(
        validPayload('afformActivistBuilder', {
          country: ['1226'],
          email: ['ada@example.com'],
        })
      )
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.fields).toEqual(['country', 'email'])
  })

  it('rejects skills submitted as a string', async () => {
    const res = await POST(
      makeRequest(validPayload('afformActivistBuilder', { skills: '1' }))
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.fields).toEqual(['skills'])
  })

  it.each(['constructor', '__proto__', 'toString'])(
    'rejects the inherited key %s as a hear-about answer',
    async (hearAbout) => {
      const res = await POST(
        makeRequest(validPayload('afformActivistBuilder', { hearAbout }))
      )

      expect(res.status).toBe(400)
      expect(submitToNotion).not.toHaveBeenCalled()
    }
  )

  it('rejects a missing required field even when Notion is disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)
    const { city: _city, ...withoutCity } = validPayload(
      'afformActivistLeaderSteward'
    )

    const res = await POST(makeRequest(withoutCity))

    expect(res.status).toBe(400)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(0)
  })

  it('returns 502 without the upstream detail when Notion fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(submitToNotion).mockResolvedValue({
      ok: false,
      message: 'Notion unavailable',
    })

    const res = await POST(makeRequest(validPayload('afformCoalitionPartner')))
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body).toEqual({ error: 'Failed to submit form. Please try again.' })
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Notion unavailable')
    )
    errorSpy.mockRestore()
  })

  it('does not forward the steward form to n8n when Notion fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(submitToNotion).mockResolvedValue({
      ok: false,
      message: 'Notion unavailable',
    })

    const res = await POST(
      makeRequest(validPayload('afformActivistLeaderSteward'))
    )

    expect(res.status).toBe(502)
    expect(submitToN8n).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('writes to Notion before forwarding to n8n', async () => {
    await POST(makeRequest(validPayload('afformActivistLeaderSteward')))

    expect(vi.mocked(submitToNotion).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(submitToN8n).mock.invocationCallOrder[0]
    )
  })

  it('skips Notion when the destination is disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)

    const res = await POST(makeRequest(validPayload('afformActivistBuilder')))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('forwards the steward form to n8n', async () => {
    const res = await POST(
      makeRequest(validPayload('afformActivistLeaderSteward'))
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledWith(
      answers('afformActivistLeaderSteward'),
      'afformActivistLeaderSteward'
    )
  })

  it.each(['afformActivistBuilder', 'afformCoalitionPartner'])(
    'does not forward %s to n8n',
    async (formName) => {
      await POST(makeRequest(validPayload(formName)))

      expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(0)
    }
  )

  it('still returns 201 when the steward n8n forward fails (best-effort)', async () => {
    vi.mocked(submitToN8n).mockResolvedValue({
      ok: false,
      message: 'n8n unavailable',
    })

    const res = await POST(
      makeRequest(validPayload('afformActivistLeaderSteward'))
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.error).toBeUndefined()
  })

  it('forwards the steward form to n8n even when Notion is disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)

    const res = await POST(
      makeRequest(validPayload('afformActivistLeaderSteward'))
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })
})
