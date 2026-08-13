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

  it('accepts a funnel submission with a valid hear-about answer', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
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

  it('rejects an unknown form name', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformCircleContactForm',
        name: 'Ada',
        hearAbout: '2',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid form name')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('drops the legacy field definitions from the submitted payload', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
        fields: [{ formKey: 'name', fieldName: 'first_name' }],
        name: 'Ada',
        hearAbout: '2',
      })
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledWith(
      { name: 'Ada', hearAbout: '2' },
      'afformActivistLeaderSteward'
    )
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledWith(
      { name: 'Ada', hearAbout: '2' },
      'afformActivistLeaderSteward'
    )
  })

  it('rejects a funnel submission missing the hear-about answer', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
        name: 'Ada',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or missing hear-about answer')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('rejects a funnel submission with an unknown hear-about id', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
        name: 'Ada',
        hearAbout: '999',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or missing hear-about answer')
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('returns 502 when the Notion submission fails', async () => {
    vi.mocked(submitToNotion).mockResolvedValue({
      ok: false,
      message: 'Notion unavailable',
    })

    const res = await POST(
      makeRequest({
        formName: 'afformCoalitionPartner',
        name: 'Ada',
        hearAbout: '2',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('Failed to submit form. Please try again.')
    expect(body.detail).toBe('Notion unavailable')
  })

  it('skips Notion when the destination is disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)

    const res = await POST(
      makeRequest({
        formName: 'afformActivistBuilder',
        name: 'Ada',
        hearAbout: '2',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })

  it('forwards the steward form to n8n', async () => {
    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
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

  it.each(['afformActivistBuilder', 'afformCoalitionPartner'])(
    'does not forward %s to n8n',
    async (formName) => {
      await POST(
        makeRequest({
          formName,
          name: 'Ada',
          hearAbout: '2',
        })
      )

      expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(0)
    }
  )

  it('still returns 201 when the steward n8n forward fails (best-effort)', async () => {
    vi.mocked(submitToN8n).mockResolvedValue({
      ok: false,
      message: 'n8n unavailable',
    })

    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
        name: 'Ada',
        hearAbout: '2',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.error).toBeUndefined()
  })

  it('forwards the steward form to n8n even when Notion is disabled', async () => {
    vi.mocked(isNotionIntakeSubmitEnabled).mockReturnValue(false)

    const res = await POST(
      makeRequest({
        formName: 'afformActivistLeaderSteward',
        name: 'Ada',
        hearAbout: '2',
      })
    )

    expect(res.status).toBe(201)
    expect(vi.mocked(submitToN8n)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(submitToNotion)).toHaveBeenCalledTimes(0)
  })
})
