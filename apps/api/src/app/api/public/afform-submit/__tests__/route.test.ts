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

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/public/afform-submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/public/afform-submit', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(true)
    vi.mocked(submitToNotion).mockResolvedValue({ ok: true })
    vi.mocked(submitToN8n).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
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

  it('accepts a required select submitted as an array', async () => {
    const res = await POST(
      makeRequest(validPayload('afformActivistBuilder', { country: ['1226'] }))
    )

    expect(res.status).toBe(201)
  })

  it('rejects a missing required field even when Notion is disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)
    const { city: _city, ...withoutCity } = validPayload(
      'afformActivistLeaderSteward'
    )

    const res = await POST(makeRequest(withoutCity))

    expect(res.status).toBe(400)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(0)
  })

  it('returns 502 when the Notion submission fails', async () => {
    vi.mocked(submitToNotion).mockResolvedValue({
      ok: false,
      message: 'Notion unavailable',
    })

    const res = await POST(makeRequest(validPayload('afformCoalitionPartner')))
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('Failed to submit form. Please try again.')
    expect(body.detail).toBe('Notion unavailable')
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
