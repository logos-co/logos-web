import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/civicrm/contacts', () => ({
  updateContact: vi.fn(),
  updateEmail: vi.fn(),
  getContactFieldValues: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUserEmail: vi.fn(() => 'editor@example.com'),
}))

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}))

import { PATCH } from '../contacts/[contactId]/route'
import {
  updateContact,
  updateEmail,
  getContactFieldValues,
} from '@/lib/civicrm/contacts'
import { logActivity } from '@/lib/activity-logger'

function makeRequest(body: unknown, contactId = '10') {
  return new Request(`http://localhost/api/contacts/${contactId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function routeParams(contactId = '10') {
  return { params: Promise.resolve({ contactId }) }
}

beforeEach(() => {
  vi.mocked(updateContact).mockResolvedValue(undefined as never)
  vi.mocked(updateEmail).mockResolvedValue(undefined as never)
  vi.mocked(logActivity).mockResolvedValue(undefined)
  vi.mocked(getContactFieldValues).mockResolvedValue({})
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('PATCH /api/contacts/[contactId]', () => {
  it('calls updateContact with stripped civiPath for Contact fields', async () => {
    await PATCH(makeRequest({ city: 'Paris' }), routeParams())

    expect(vi.mocked(updateContact)).toHaveBeenCalledWith(
      '10',
      expect.objectContaining({ 'address_primary.city': 'Paris' })
    )
  })

  it('calls updateEmail for Email fields', async () => {
    await PATCH(makeRequest({ emailPrimary: 'new@example.com' }), routeParams())

    expect(vi.mocked(updateEmail)).toHaveBeenCalledWith('10', 'new@example.com')
  })

  it('fires Contact and Email writes in parallel when both present', async () => {
    const order: string[] = []
    vi.mocked(updateContact).mockImplementation(async () => {
      order.push('contact')
      return undefined as never
    })
    vi.mocked(updateEmail).mockImplementation(async () => {
      order.push('email')
      return undefined as never
    })

    await PATCH(
      makeRequest({ city: 'Paris', emailPrimary: 'x@y.com' }),
      routeParams()
    )

    // Both must have been called (order is not guaranteed — they run in parallel)
    expect(order).toContain('contact')
    expect(order).toContain('email')
  })

  it('returns 207 when updateContact fails', async () => {
    vi.mocked(updateContact).mockRejectedValue(new Error('Timeout'))

    const res = await PATCH(makeRequest({ city: 'Paris' }), routeParams())
    const body = await res.json()

    expect(res.status).toBe(207)
    expect(body.results.Contact.ok).toBe(false)
    expect(body.results.Contact.error).toBeDefined()
  })

  it('returns 207 when updateEmail fails', async () => {
    vi.mocked(updateEmail).mockRejectedValue(new Error('Email error'))

    const res = await PATCH(
      makeRequest({ emailPrimary: 'x@y.com' }),
      routeParams()
    )
    const body = await res.json()

    expect(res.status).toBe(207)
    expect(body.results.Email.ok).toBe(false)
  })

  it('does not call logActivity on failure', async () => {
    vi.mocked(updateContact).mockRejectedValue(new Error('DB error'))

    await PATCH(makeRequest({ city: 'Paris' }), routeParams())

    expect(vi.mocked(logActivity)).not.toHaveBeenCalled()
  })

  it('calls logActivity and returns 200 on full success', async () => {
    const res = await PATCH(makeRequest({ city: 'Paris' }), routeParams())

    expect(res.status).toBe(200)
    expect(vi.mocked(logActivity)).toHaveBeenCalledOnce()
    expect(vi.mocked(logActivity)).toHaveBeenCalledWith(
      'editor@example.com',
      { type: 'contact', contactId: '10' },
      expect.any(Array)
    )
  })

  it('ignores unknown field keys silently', async () => {
    const res = await PATCH(
      makeRequest({ unknownField: 'value' }),
      routeParams()
    )

    // No writes fired, but still succeeds (no-op)
    expect(res.status).toBe(200)
    expect(vi.mocked(updateContact)).not.toHaveBeenCalled()
    expect(vi.mocked(updateEmail)).not.toHaveBeenCalled()
  })

  it('passes before-values from getContactFieldValues as "from" to logActivity', async () => {
    vi.mocked(getContactFieldValues).mockResolvedValue({ city: 'Berlin' })

    await PATCH(makeRequest({ city: 'Paris' }), routeParams())

    const changes = vi.mocked(logActivity).mock.calls[0][2]
    const cityChange = changes.find((c) => c.key === 'city')
    expect(cityChange?.from).toBe('Berlin')
    expect(cityChange?.to).toBe('Paris')
  })

  it('does not throw when logActivity fails', async () => {
    vi.mocked(logActivity).mockRejectedValue(new Error('CiviCRM down'))

    const res = await PATCH(makeRequest({ city: 'Paris' }), routeParams())

    expect(res.status).toBe(200)
  })
})
