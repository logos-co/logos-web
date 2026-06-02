import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { submitToCiviCrm } from '../submit-afform'

const fieldDefs = [
  {
    entity: 'Individual1',
    formKey: 'name',
    fieldName: 'first_name',
    join: null,
    inputType: 'text',
  },
]

describe('submitToCiviCrm', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CIVICRM_BASE_URL: 'https://civi.example',
      CIVICRM_API_KEY: 'test-key',
    }
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('returns ok when Afform.submit succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '',
    } as Response)

    const result = await submitToCiviCrm(
      { name: 'Ada' },
      fieldDefs,
      'afformActivistBuilder'
    )

    expect(result).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith(
      'https://civi.example/civicrm/ajax/api4/Afform/submit',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Civi-Auth': 'Bearer test-key',
        }),
      })
    )
  })

  it('returns failure when CiviCRM is not configured', async () => {
    delete process.env.CIVICRM_BASE_URL

    const result = await submitToCiviCrm(
      { name: 'Ada' },
      fieldDefs,
      'afformActivistBuilder'
    )

    expect(result).toEqual({ ok: false, message: 'CiviCRM is not configured' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns failure when Afform.submit responds with an error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    } as Response)

    const result = await submitToCiviCrm(
      { name: 'Ada' },
      fieldDefs,
      'afformActivistBuilder'
    )

    expect(result).toEqual({
      ok: false,
      message: 'Afform.submit (500): internal error',
    })
  })
})
