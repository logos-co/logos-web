import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CiviCRMError } from '@/lib/civicrm/client'
import type { CaseDetail, PaginatedResponse, CaseListItem } from '@/types/case'

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/civicrm/cases', () => ({
  listCases: vi.fn(),
  getCaseById: vi.fn(),
  updateCase: vi.fn(),
}))

vi.mock('@/lib/civicrm/contacts', () => ({
  updateContact: vi.fn(),
  updateEmail: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUserEmail: vi.fn(() => 'editor@example.com'),
}))

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}))

import { GET as casesGET } from '../cases/route'
import { GET as caseGET, PATCH as casePATCH } from '../cases/[id]/route'
import { listCases, getCaseById, updateCase } from '@/lib/civicrm/cases'
import { updateContact, updateEmail } from '@/lib/civicrm/contacts'
import { logActivity } from '@/lib/activity-logger'
import { revalidateTag } from 'next/cache'

function makeRequest(
  method: string,
  body?: unknown,
  url = 'http://localhost/'
) {
  if (body === undefined) return new Request(url, { method })
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeEmptyPaginated(): PaginatedResponse<CaseListItem> {
  return { items: [], total: 0, page: 1, pageSize: 20 }
}

function makeCaseDetail(
  fieldOverrides: Record<string, unknown> = {}
): CaseDetail {
  return {
    id: '1',
    subject: 'Test Case',
    contactId: '10',
    fieldValues: {
      status: 'Open',
      leadSource: null,
      city: 'Berlin',
      ...fieldOverrides,
    },
    otherCases: [],
    groupMemberships: [],
    coordinatorRelationshipId: '99',
  }
}

// All six scorecard field keys with score values (1–5)
const allScorecardFields = {
  missionValuesAlignment: 5,
  commitmentReliability: 4,
  facilitationDistributedLeadership: 3,
  executionAbility: 4,
  relevantSkillsExperience: 5,
  overallFit: 4,
}

beforeEach(() => {
  vi.mocked(getCaseById).mockResolvedValue(makeCaseDetail())
  vi.mocked(updateCase).mockResolvedValue(undefined as never)
  vi.mocked(updateContact).mockResolvedValue(undefined as never)
  vi.mocked(updateEmail).mockResolvedValue(undefined as never)
  vi.mocked(logActivity).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET /api/cases
// ---------------------------------------------------------------------------

describe('GET /api/cases', () => {
  it('forwards status filter to listCases', async () => {
    vi.mocked(listCases).mockResolvedValue(makeEmptyPaginated())

    await casesGET(
      makeRequest('GET', undefined, 'http://localhost/api/cases?status=ongoing')
    )

    expect(vi.mocked(listCases)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'ongoing' }),
      1
    )
  })

  it('forwards assignee filter as assigneeContactId', async () => {
    vi.mocked(listCases).mockResolvedValue(makeEmptyPaginated())

    await casesGET(
      makeRequest('GET', undefined, 'http://localhost/api/cases?assignee=42')
    )

    expect(vi.mocked(listCases)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ assigneeContactId: '42' }),
      1
    )
  })

  it('forwards sort and order to listCases', async () => {
    vi.mocked(listCases).mockResolvedValue(makeEmptyPaginated())

    await casesGET(
      makeRequest(
        'GET',
        undefined,
        'http://localhost/api/cases?sort=status&order=desc'
      )
    )

    expect(vi.mocked(listCases)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sort: 'status', order: 'desc' }),
      1
    )
  })

  it('forwards page number to listCases', async () => {
    vi.mocked(listCases).mockResolvedValue(makeEmptyPaginated())

    await casesGET(
      makeRequest('GET', undefined, 'http://localhost/api/cases?page=3')
    )

    expect(vi.mocked(listCases)).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      3
    )
  })

  it('defaults to page 1 and sort=subject asc when params are absent', async () => {
    vi.mocked(listCases).mockResolvedValue(makeEmptyPaginated())

    await casesGET(makeRequest('GET', undefined, 'http://localhost/api/cases'))

    expect(vi.mocked(listCases)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sort: 'subject', order: 'asc' }),
      1
    )
  })

  it('returns the paginated result as JSON', async () => {
    const payload: PaginatedResponse<CaseListItem> = {
      items: [
        {
          id: '1',
          subject: 'S',
          status: { value: 'open', label: 'Open' },
          leadSource: null,
          scorecard: null,
          assignedTo: null,
          leadContactName: 'Alice',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }
    vi.mocked(listCases).mockResolvedValue(payload)

    const res = await casesGET(
      makeRequest('GET', undefined, 'http://localhost/api/cases')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.total).toBe(1)
    expect(body.items[0].id).toBe('1')
  })
})

// ---------------------------------------------------------------------------
// GET /api/cases/[id]
// ---------------------------------------------------------------------------

describe('GET /api/cases/[id]', () => {
  it('returns 404 when getCaseById throws CiviCRMError(404)', async () => {
    vi.mocked(getCaseById).mockRejectedValue(new CiviCRMError(404, 'Not found'))

    const res = await caseGET(
      makeRequest('GET', undefined, 'http://localhost/api/cases/99'),
      {
        params: Promise.resolve({ id: '99' }),
      }
    )

    expect(res.status).toBe(404)
  })

  it('returns case detail as JSON on success', async () => {
    const res = await caseGET(
      makeRequest('GET', undefined, 'http://localhost/api/cases/1'),
      {
        params: Promise.resolve({ id: '1' }),
      }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('1')
    expect(body.subject).toBe('Test Case')
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/cases/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/cases/[id]', () => {
  it('injects computed Circle_Case.Scorecard into Case write when all scoring fields present', async () => {
    const res = await casePATCH(
      makeRequest('PATCH', allScorecardFields, 'http://localhost/api/cases/1'),
      { params: Promise.resolve({ id: '1' }) }
    )

    expect(res.status).toBe(200)
    const caseCallValues = vi.mocked(updateCase).mock.calls[0][1]
    expect(caseCallValues).toHaveProperty('Circle_Case.Scorecard')
    // (5+4+3+4+5+4)/6 = 4.17
    expect(caseCallValues['Circle_Case.Scorecard']).toBe(4.17)
  })

  it('returns 400 when only some scoring fields are present', async () => {
    const partial = { missionValuesAlignment: 5, commitmentReliability: 4 }

    const res = await casePATCH(
      makeRequest('PATCH', partial, 'http://localhost/api/cases/1'),
      { params: Promise.resolve({ id: '1' }) }
    )

    expect(res.status).toBe(400)
  })

  it('returns 207 on partial write failure', async () => {
    vi.mocked(updateContact).mockRejectedValue(new Error('CiviCRM unavailable'))

    const body = { status: 'ongoing', city: 'Paris' }
    const res = await casePATCH(
      makeRequest('PATCH', body, 'http://localhost/api/cases/1'),
      { params: Promise.resolve({ id: '1' }) }
    )
    const data = await res.json()

    expect(res.status).toBe(207)
    expect(data.results.Case.ok).toBe(true)
    expect(data.results.Contact.ok).toBe(false)
    expect(data.results.Contact.error).toBeDefined()
  })

  it('does not call logActivity on partial write failure', async () => {
    vi.mocked(updateContact).mockRejectedValue(new Error('DB error'))

    await casePATCH(
      makeRequest(
        'PATCH',
        { status: 'ongoing', city: 'Paris' },
        'http://localhost/api/cases/1'
      ),
      { params: Promise.resolve({ id: '1' }) }
    )

    expect(vi.mocked(logActivity)).not.toHaveBeenCalled()
  })

  it('calls logActivity and revalidateTag on full success', async () => {
    await casePATCH(
      makeRequest(
        'PATCH',
        { status: 'ongoing' },
        'http://localhost/api/cases/1'
      ),
      { params: Promise.resolve({ id: '1' }) }
    )

    expect(vi.mocked(logActivity)).toHaveBeenCalledOnce()
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith('cases', 'default')
  })

  it('routes Contact fields to updateContact stripping contact_id. prefix', async () => {
    await casePATCH(
      makeRequest('PATCH', { city: 'Paris' }, 'http://localhost/api/cases/1'),
      { params: Promise.resolve({ id: '1' }) }
    )

    expect(vi.mocked(updateContact)).toHaveBeenCalledWith(
      '10',
      expect.objectContaining({ 'address_primary.city': 'Paris' })
    )
  })

  it('routes Email fields to updateEmail', async () => {
    await casePATCH(
      makeRequest(
        'PATCH',
        { emailPrimary: 'new@example.com' },
        'http://localhost/api/cases/1'
      ),
      { params: Promise.resolve({ id: '1' }) }
    )

    expect(vi.mocked(updateEmail)).toHaveBeenCalledWith('10', 'new@example.com')
  })

  it('returns 404 when case is not found', async () => {
    vi.mocked(getCaseById).mockRejectedValue(new CiviCRMError(404, 'Not found'))

    const res = await casePATCH(
      makeRequest(
        'PATCH',
        { status: 'ongoing' },
        'http://localhost/api/cases/99'
      ),
      { params: Promise.resolve({ id: '99' }) }
    )

    expect(res.status).toBe(404)
  })

  it('passes before-values from caseDetail.fieldValues as "from" to logActivity', async () => {
    vi.mocked(getCaseById).mockResolvedValue(makeCaseDetail({ status: 'Open' }))

    await casePATCH(
      makeRequest(
        'PATCH',
        { status: 'ongoing' },
        'http://localhost/api/cases/1'
      ),
      { params: Promise.resolve({ id: '1' }) }
    )

    const changes = vi.mocked(logActivity).mock.calls[0][2]
    const statusChange = changes.find((c) => c.key === 'status')
    expect(statusChange?.from).toBe('Open')
    expect(statusChange?.to).toBe('ongoing')
  })
})
