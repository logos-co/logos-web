import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/civicrm/submit-afform', () => ({
  submitToCiviCrm: vi.fn(),
}))

vi.mock('@/lib/notion/submit', () => ({
  submitToNotion: vi.fn(),
}))

vi.mock('@/lib/intake-submit-flags', () => ({
  isCiviCrmIntakeSubmitEnabled: vi.fn(),
  isNotionIntakeSubmitEnabled: vi.fn(),
}))

vi.mock('@/lib/n8n/submit', () => ({
  submitToN8n: vi.fn(),
}))

import { POST } from '../route'
import { submitToCiviCrm } from '@/lib/civicrm/submit-afform'
import { submitToNotion } from '@/lib/notion/submit'
import {
  isCiviCrmIntakeSubmitEnabled,
  isNotionIntakeSubmitEnabled,
} from '@/lib/intake-submit-flags'
import { submitToN8n } from '@/lib/n8n/submit'

const formFields = [
  {
    entity: 'Individual1',
    formKey: 'name',
    fieldName: 'first_name',
    join: null,
    inputType: 'text',
  },
]

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
    vi.mocked(isCiviCrmIntakeSubmitEnabled).mockReturnValue(true)
    vi.mocked(submitToCiviCrm).mockResolvedValue({ ok: true })
    vi.mocked(submitToNotion).mockResolvedValue({ ok: true })
    vi.mocked(submitToN8n).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('skips Notion for connect form submissions', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformCircleContactForm',
        fields: formFields,
        name: 'Ada',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
    expect(vi.mocked(submitToCiviCrm)).toHaveBeenCalledWith(
      { name: 'Ada' },
      formFields,
      'afformCircleContactForm'
    )
  })

  it('accepts a funnel submission with a valid hear-about answer', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
        fields: formFields,
        name: 'Ada',
        hearAbout: '2',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledWith(
      { name: 'Ada', hearAbout: '2' },
      'afformActivistBuilder'
    )
  })

  it('rejects a funnel submission missing the hear-about answer', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
        fields: formFields,
        name: 'Ada',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or missing hear-about answer')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
    expect(vi.mocked(submitToCiviCrm)).toHaveBeenCalledTimes(0)
  })

  it('rejects a funnel submission with an unknown hear-about id', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
        fields: formFields,
        name: 'Ada',
        hearAbout: '999',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or missing hear-about answer')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('does not require hear-about on the connect form', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformCircleContactForm',
        fields: formFields,
        name: 'Ada',
      })
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToCiviCrm)).toHaveBeenCalledTimes(1)
  })

  it('returns 502 when connect CiviCRM submission fails', async () => {
    vi.mocked(submitToCiviCrm).mockResolvedValue({
      ok: false,
      message: 'CiviCRM unavailable',
    })

    const res = await POST(
      makeRequest({
        formName: 'afformCircleContactForm',
        fields: formFields,
        name: 'Ada',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('Failed to submit form. Please try again.')
    expect(body.detail).toBe('CiviCRM unavailable')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('forwards the steward form to n8n', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
        fields: formFields,
        name: 'Ada',
        hearAbout: '2',
      })
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledWith(
      { name: 'Ada', hearAbout: '2' },
      'afformActivistLeaderSteward'
    )
  })

  it.each([
    'afformActivistBuilder',
    'afformCoalitionPartner',
    'afformCircleContactForm',
  ])('does not forward %s to n8n', async (formName) => {
    await POST(
      makeRequest({
        formName,
        fields: formFields,
        name: 'Ada',
        hearAbout: '2',
      })
    )

    expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(0)
  })

  it('still returns 201 when the steward n8n forward fails (best-effort)', async () => {
    vi.mocked(submitToN8n).mockResolvedValue({
      ok: false,
      message: 'n8n unavailable',
    })

    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
        fields: formFields,
        name: 'Ada',
        hearAbout: '2',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.error).toBeUndefined()
  })

  it('forwards the steward form to n8n even when Notion and CiviCRM are disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)
    vi.mocked(isCiviCrmIntakeSubmitEnabled).mockReturnValue(false)

    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
        fields: formFields,
        name: 'Ada',
        hearAbout: '2',
      })
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
    expect(vi.mocked(submitToCiviCrm)).toHaveBeenCalledTimes(0)
  })
})
