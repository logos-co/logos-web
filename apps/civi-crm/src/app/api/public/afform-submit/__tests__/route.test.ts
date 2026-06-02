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

import { POST } from '../route'
import { submitToCiviCrm } from '@/lib/civicrm/submit-afform'
import { submitToNotion } from '@/lib/notion/submit'
import {
  isCiviCrmIntakeSubmitEnabled,
  isNotionIntakeSubmitEnabled,
} from '@/lib/intake-submit-flags'

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
})
