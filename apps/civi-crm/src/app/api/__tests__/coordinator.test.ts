import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CiviCRMError } from '@/lib/civicrm/client'
import type { CaseDetail } from '@/types/case'

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/civicrm/cases', () => ({
  getCaseById: vi.fn(),
}))

vi.mock('@/lib/civicrm/relationships', () => ({
  getCoordinatorRelationship: vi.fn(),
  deleteRelationship: vi.fn(),
  createCoordinatorRelationship: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUserEmail: vi.fn(() => 'editor@example.com'),
}))

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}))

import { PATCH } from '../cases/[id]/coordinator/route'
import { getCaseById } from '@/lib/civicrm/cases'
import {
  getCoordinatorRelationship,
  deleteRelationship,
  createCoordinatorRelationship,
} from '@/lib/civicrm/relationships'
import { revalidateTag } from 'next/cache'

function makeRequest(
  body: unknown,
  url = 'http://localhost/api/cases/1/coordinator'
) {
  return new Request(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeCaseDetail(): CaseDetail {
  return {
    id: '1',
    subject: 'Test',
    contactId: '10',
    fieldValues: {},
    otherCases: [],
    groupMemberships: [],
    coordinatorRelationshipId: '5',
  }
}

const routeParams = { params: Promise.resolve({ id: '1' }) }

beforeEach(() => {
  vi.mocked(getCaseById).mockResolvedValue(makeCaseDetail())
  vi.mocked(getCoordinatorRelationship).mockResolvedValue({
    id: '5',
    contactId: '20',
  })
  vi.mocked(deleteRelationship).mockResolvedValue(undefined as never)
  vi.mocked(createCoordinatorRelationship).mockResolvedValue(undefined as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('PATCH /api/cases/[id]/coordinator', () => {
  it('calls deleteRelationship before createCoordinatorRelationship', async () => {
    const order: string[] = []
    vi.mocked(deleteRelationship).mockImplementation(async () => {
      order.push('delete')
      return undefined as never
    })
    vi.mocked(createCoordinatorRelationship).mockImplementation(async () => {
      order.push('create')
      return undefined as never
    })

    await PATCH(makeRequest({ newCoordinatorContactId: '30' }), routeParams)

    expect(order).toEqual(['delete', 'create'])
  })

  it('returns 500 and does not call create when delete fails', async () => {
    vi.mocked(deleteRelationship).mockRejectedValue(new Error('Lock timeout'))

    const res = await PATCH(
      makeRequest({ newCoordinatorContactId: '30' }),
      routeParams
    )

    expect(res.status).toBe(500)
    expect(vi.mocked(createCoordinatorRelationship)).not.toHaveBeenCalled()
  })

  it('returns 500 mentioning "no coordinator" when create fails after delete succeeds', async () => {
    vi.mocked(createCoordinatorRelationship).mockRejectedValue(
      new Error('Constraint error')
    )

    const res = await PATCH(
      makeRequest({ newCoordinatorContactId: '30' }),
      routeParams
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toContain('no coordinator')
  })

  it('returns 200 and revalidates both tags on success', async () => {
    const res = await PATCH(
      makeRequest({ newCoordinatorContactId: '30' }),
      routeParams
    )

    expect(res.status).toBe(200)
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
      'coordinators',
      'default'
    )
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith('cases', 'default')
  })

  it('returns 404 when case is not found', async () => {
    vi.mocked(getCaseById).mockRejectedValue(new CiviCRMError(404, 'Not found'))

    const res = await PATCH(
      makeRequest({ newCoordinatorContactId: '30' }),
      routeParams
    )

    expect(res.status).toBe(404)
  })

  it('returns 400 when newCoordinatorContactId is missing', async () => {
    const res = await PATCH(makeRequest({}), routeParams)

    expect(res.status).toBe(400)
  })

  it('skips delete when no existing coordinator relationship exists', async () => {
    vi.mocked(getCoordinatorRelationship).mockResolvedValue(null)

    const res = await PATCH(
      makeRequest({ newCoordinatorContactId: '30' }),
      routeParams
    )

    expect(res.status).toBe(200)
    expect(vi.mocked(deleteRelationship)).not.toHaveBeenCalled()
    expect(vi.mocked(createCoordinatorRelationship)).toHaveBeenCalledOnce()
  })
})
