import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCaseSelect, getCaseById, listCases, updateCase } from '../cases'
import { getActiveView } from '@/lib/views'

function okResponse<T>(values: T[], count = values.length) {
  return new Response(JSON.stringify({ values, count }), { status: 200 })
}

function getRequestedParams(url: string): {
  where?: unknown[]
  values?: Record<string, unknown>
  [key: string]: unknown
} {
  const parsedUrl = new URL(url, 'https://example.test')
  const rawParams = parsedUrl.searchParams.get('params')
  if (!rawParams) return {}
  return JSON.parse(rawParams) as {
    where?: unknown[]
    values?: Record<string, unknown>
    [key: string]: unknown
  }
}

const view = getActiveView()

describe('buildCaseSelect', () => {
  it('excludes skipSelect fields (coordinator.display_name)', () => {
    const select = buildCaseSelect(view)
    expect(select.includes('coordinator.display_name')).toBe(false)
  })

  it('includes Case field paths and label/name variants', () => {
    const select = buildCaseSelect(view)
    expect(select).toContain('Circle_Case.Lead_Source')
    expect(select).toContain('Circle_Case.Lead_Source:label')
    expect(select).toContain('Circle_Case.Lead_Source:name')
  })

  it('always includes id', () => {
    const select = buildCaseSelect(view)
    expect(select).toContain('id')
  })

  it('excludes Contact/Email fields from the Case select', () => {
    const select = buildCaseSelect(view)
    // emailPrimary is an Email-entity field with civiPath 'contact_id.email_primary'
    expect(select.includes('contact_id.email_primary')).toBe(false)
  })
})

describe('listCases', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('always adds case_type_id:name WHERE clause from view.caseTypeName', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            subject: 'S',
            'status_id:label': 'Open',
            'status_id:name': 'open',
            'Circle_Case.Scorecard': null,
          },
        ])
      )
      .mockResolvedValueOnce(okResponse([], 1))
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            case_id: 1,
            contact_id: 10,
            'contact_id.display_name': 'Alice',
            role: 'Client',
          },
        ])
      )
      .mockResolvedValueOnce(okResponse([]))

    await listCases(view, {}, 1)

    const caseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/Case/get'))
    expect(caseCall).toBeDefined()
    const body = getRequestedParams(String(caseCall![0]))
    expect(body.where).toContainEqual([
      'case_type_id:name',
      '=',
      view.caseTypeName,
    ])
  })

  it('omits status_id:name filter when status is undefined', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(okResponse([])))

    await listCases(view, {}, 1)

    const caseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/Case/get'))
    const body = getRequestedParams(String(caseCall![0]))
    const statusFilter = body.where?.find(
      ([f]: [string]) => f === 'status_id:name'
    )
    expect(statusFilter).toBeUndefined()
  })

  it('adds status_id:name filter when status is provided', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(okResponse([])))

    await listCases(view, { status: 'open' }, 1)

    const caseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/Case/get'))
    const body = getRequestedParams(String(caseCall![0]))
    expect(body.where).toContainEqual(['status_id:name', '=', 'open'])
  })

  it('returns empty result immediately when assignee has no coordinator relationships', async () => {
    // First fetch is the Relationship pre-step
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([]))

    const result = await listCases(view, { assigneeContactId: '99' }, 1)

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 20 })
  })

  it('injects id IN filter when assignee has coordinator relationships', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            contact_id_a: 5,
            contact_id_b: 99,
            case_id: 42,
            'relationship_type_id:name': 'Case Coordinator is',
            'contact_id_b.display_name': 'Bob',
          },
        ])
      )
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(okResponse([], 0))

    await listCases(view, { assigneeContactId: '99' }, 1)

    const caseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/Case/get'))
    expect(caseCall).toBeDefined()
    const body = getRequestedParams(String(caseCall![0]))
    expect(body.where).toContainEqual(['id', 'IN', [42]])
  })

  it('fires only 2 Case/get calls when Round 1 returns no cases', async () => {
    // Round 1: paginated rows + count (both use /Case/get via limit:0)
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([], 0))
      .mockResolvedValueOnce(okResponse([], 0))

    await listCases(view, {}, 1)

    const caseCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes('/Case/get'))
    expect(caseCalls).toHaveLength(2)
    // No Round 2 CaseContact/Relationship calls
    expect(vi.mocked(fetch).mock.calls).toHaveLength(2)
  })

  it('merges coordinator display name by case_id', async () => {
    const caseRow = {
      id: 7,
      subject: 'Test',
      'status_id:label': 'Open',
      'status_id:name': 'open',
      'Circle_Case.Scorecard': 3.5,
      'Circle_Case.Lead_Source:label': null,
    }
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([caseRow]))
      .mockResolvedValueOnce(okResponse([], 1))
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            case_id: 7,
            contact_id: 10,
            'contact_id.display_name': 'Alice',
            role: 'Client',
          },
        ])
      )
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 100,
            contact_id_a: 10,
            contact_id_b: 20,
            case_id: 7,
            'relationship_type_id:name': 'Case Coordinator is',
            'contact_id_b.display_name': 'Eve Coordinator',
          },
        ])
      )

    const result = await listCases(view, {}, 1)

    expect(result.items[0].assignedTo).toBe('Eve Coordinator')
  })

  it('merges lead contact display name by case_id', async () => {
    const caseRow = {
      id: 7,
      subject: 'Test',
      'status_id:label': 'Open',
      'status_id:name': 'open',
      'Circle_Case.Scorecard': null,
    }
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([caseRow]))
      .mockResolvedValueOnce(okResponse([], 1))
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            case_id: 7,
            contact_id: 10,
            'contact_id.display_name': 'Alice Smith',
            role: 'Client',
          },
        ])
      )
      .mockResolvedValueOnce(okResponse([]))

    const result = await listCases(view, {}, 1)

    expect(result.items[0].leadContactName).toBe('Alice Smith')
  })

  it('returns correct pagination metadata', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            subject: 'S',
            'status_id:label': 'Open',
            'status_id:name': 'open',
            'Circle_Case.Scorecard': null,
          },
        ])
      )
      .mockResolvedValueOnce(okResponse([{ row_count: 42 }]))
      .mockResolvedValueOnce(
        okResponse([
          {
            id: 1,
            case_id: 1,
            contact_id: 5,
            'contact_id.display_name': 'X',
          },
        ])
      )
      .mockResolvedValueOnce(okResponse([]))

    const result = await listCases(view, {}, 3)

    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(20)
    expect(result.total).toBe(42)
  })
})

describe('getCaseById', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockRound1And2() {
    const caseRow = {
      id: 5,
      subject: 'My Case',
      'status_id:label': 'Open',
      'status_id:name': 'open',
      'Circle_Case.Lead_Source:label': null,
      'Circle_Case.Notes': 'hello',
      'Circle_Case.Scorecard': 4,
    }
    const caseContact = {
      case_id: 5,
      contact_id: 10,
      role: 'Client',
      'contact_id.display_name': 'Alice',
      'contact_id.email_primary': 'alice@example.com',
    }
    const coordinatorRel = {
      id: 99,
      contact_id_a: 10,
      contact_id_b: 20,
      case_id: 5,
      'relationship_type_id:name': 'Case Coordinator is',
      'contact_id_b.display_name': 'Bob',
    }
    // Round 1 responses
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([caseRow])) // Case.get
      .mockResolvedValueOnce(okResponse([caseContact])) // CaseContact.get
      .mockResolvedValueOnce(okResponse([coordinatorRel])) // Relationship.get
      // Round 2
      .mockResolvedValueOnce(okResponse([])) // other CaseContacts
      .mockResolvedValueOnce(okResponse([])) // GroupContact
  }

  it('fires 3 fetch calls in Round 1 (Case + CaseContact + Relationship)', async () => {
    mockRound1And2()
    await getCaseById('5', view)
    // Total calls: 3 (Round 1) + 2 (Round 2) = 5
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(5)
  })

  it('throws CiviCRMError(404) when Case.get returns empty', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([])) // Case.get returns nothing
      .mockResolvedValueOnce(okResponse([])) // CaseContact
      .mockResolvedValueOnce(okResponse([])) // Relationship

    const err = await getCaseById('99', view).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(Error)
    expect((err as { status?: number }).status).toBe(404)
  })

  it('returns coordinatorRelationshipId: null when no Relationship row', async () => {
    const caseRow = {
      id: 5,
      subject: 'X',
      'status_id:label': 'Open',
      'status_id:name': 'open',
    }
    const caseContact = {
      case_id: 5,
      contact_id: 10,
      role: 'Client',
      'contact_id.display_name': 'A',
      'contact_id.email_primary': 'a@b.com',
    }
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([caseRow]))
      .mockResolvedValueOnce(okResponse([caseContact]))
      .mockResolvedValueOnce(okResponse([])) // no coordinator
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(okResponse([]))

    const result = await getCaseById('5', view)
    expect(result.coordinatorRelationshipId).toBeNull()
  })

  it('returns coordinatorRelationshipId as string when relationship exists', async () => {
    mockRound1And2()
    const result = await getCaseById('5', view)
    expect(result.coordinatorRelationshipId).toBe('99')
  })

  it('derives contactId from the first CaseContact row', async () => {
    mockRound1And2()
    const result = await getCaseById('5', view)
    expect(result.contactId).toBe('10')
  })

  it('populates otherCases excluding current caseId', async () => {
    const caseRow = {
      id: 5,
      subject: 'X',
      'status_id:label': 'Open',
      'status_id:name': 'open',
    }
    const caseContact = {
      case_id: 5,
      contact_id: 10,
      role: 'Client',
      'contact_id.display_name': 'A',
      'contact_id.email_primary': 'a@b.com',
    }
    vi.mocked(fetch)
      .mockResolvedValueOnce(okResponse([caseRow]))
      .mockResolvedValueOnce(okResponse([caseContact]))
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(
        okResponse([{ case_id: 7, 'case_id.subject': 'Other case' }])
      )
      .mockResolvedValueOnce(okResponse([]))

    const result = await getCaseById('5', view)
    expect(result.otherCases).toEqual([{ id: '7', subject: 'Other case' }])
  })
})

describe('updateCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls update with correct where clause using numeric case id', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ values: [], count: 0 }), { status: 200 })
    )
    await updateCase('42', { subject: 'New title' })

    const call = vi.mocked(fetch).mock.calls[0]
    expect(String(call[0])).toContain('/Case/update')
    const body = getRequestedParams(String(call[0]))
    expect(body.where).toContainEqual(['id', '=', 42])
  })

  it('strips Circle_Case.Scorecard from civiValues before sending', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ values: [], count: 0 }), { status: 200 })
    )
    await updateCase('1', { subject: 'X', 'Circle_Case.Scorecard': 3.5 })

    const body = getRequestedParams(String(vi.mocked(fetch).mock.calls[0][0]))
    expect(
      Object.prototype.hasOwnProperty.call(body.values, 'Circle_Case.Scorecard')
    ).toBe(false)
    expect(body.values).toHaveProperty('subject', 'X')
  })
})
