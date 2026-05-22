import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logActivity, buildSubject, buildDetails } from '../activity-logger'
import type { ActivityTarget, FieldChange } from '../activity-logger'

vi.mock('../civicrm/contacts', () => ({
  resolveOrCreateContactByEmail: vi.fn(),
  getContactById: vi.fn(),
}))

vi.mock('../civicrm/activities', () => ({
  createActivity: vi.fn(),
}))

import {
  resolveOrCreateContactByEmail,
  getContactById,
} from '../civicrm/contacts'
import { createActivity } from '../civicrm/activities'

function makeContact(displayName: string, firstName = '') {
  return {
    contactId: '1',
    fieldValues: { display_name: displayName, first_name: firstName },
  }
}

beforeEach(() => {
  vi.mocked(resolveOrCreateContactByEmail).mockResolvedValue('1')
  vi.mocked(getContactById).mockResolvedValue(
    makeContact('Alice Smith', 'Alice')
  )
  vi.mocked(createActivity).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

const caseTarget: ActivityTarget = {
  type: 'case',
  caseId: '5',
  contactId: '10',
}
const contactTarget: ActivityTarget = { type: 'contact', contactId: '10' }
const statusChange: FieldChange = {
  key: 'status',
  label: 'Status',
  from: 'Open',
  to: 'Completed',
}

// ---------------------------------------------------------------------------
// buildSubject
// ---------------------------------------------------------------------------

describe('buildSubject', () => {
  it('single change: includes from and to when subject fits within 128 chars', () => {
    const s = buildSubject('Alice Smith', 'Case', [statusChange])
    expect(s).toBe('*Alice Smith* updated Case "Status": Open → Completed')
  })

  it('single change: strips from/to when the full subject would exceed 128 chars', () => {
    const longFrom = 'A'.repeat(80)
    const longTo = 'B'.repeat(80)
    const change: FieldChange = {
      key: 'notes',
      label: 'Notes',
      from: longFrom,
      to: longTo,
    }
    const s = buildSubject('Alice Smith', 'Case', [change])
    expect(s).not.toContain(longFrom)
    expect(s).not.toContain(longTo)
    expect(s).toContain('"Notes"')
    expect(s.length).toBeLessThanOrEqual(128)
  })

  it('multiple changes: lists field names only, no values', () => {
    const changes: FieldChange[] = [
      { key: 'status', label: 'Status', from: 'Open', to: 'Completed' },
      { key: 'notes', label: 'Notes', from: 'old', to: 'new' },
    ]
    const s = buildSubject('Alice Smith', 'Case', changes)
    expect(s).toContain('Status')
    expect(s).toContain('Notes')
    expect(s).not.toContain('Open')
    expect(s).not.toContain('Completed')
  })

  it('multiple changes: truncates with ellipsis when field list is too long', () => {
    const changes = Array.from({ length: 20 }, (_, i) => ({
      key: `field${i}`,
      label: `Very Long Field Name Number ${i}`,
      from: 'x',
      to: 'y',
    }))
    const s = buildSubject('Alice Smith', 'Case', changes)
    expect(s.length).toBeLessThanOrEqual(128)
    expect(s.endsWith('…')).toBe(true)
  })

  it('never exceeds 128 chars under any input', () => {
    const longName = 'A'.repeat(200)
    const change: FieldChange = {
      key: 'f',
      label: 'B'.repeat(200),
      from: 'C'.repeat(200),
      to: 'D'.repeat(200),
    }
    const s = buildSubject(longName, 'Case', [change])
    expect(s.length).toBeLessThanOrEqual(128)
  })
})

// ---------------------------------------------------------------------------
// buildDetails
// ---------------------------------------------------------------------------

describe('buildDetails', () => {
  const date = '2026-05-21 12:00:00'

  it('includes full display name and email', () => {
    const d = buildDetails(
      'Alice Smith',
      'alice@example.com',
      'Case',
      '5',
      [statusChange],
      date
    )
    expect(d).toContain('Alice Smith')
    expect(d).toContain('alice@example.com')
  })

  it('includes the date', () => {
    const d = buildDetails(
      'Alice Smith',
      'alice@example.com',
      'Case',
      '5',
      [statusChange],
      date
    )
    expect(d).toContain(date)
  })

  it('includes entity name and id', () => {
    const d = buildDetails(
      'Alice Smith',
      'alice@example.com',
      'Case',
      '5',
      [statusChange],
      date
    )
    expect(d).toContain('Case')
    expect(d).toContain('#5')
  })

  it('includes field label, full before and after values', () => {
    const change: FieldChange = {
      key: 'notes',
      label: 'Notes',
      from: 'old note text',
      to: 'new note text',
    }
    const d = buildDetails(
      'Alice Smith',
      'alice@example.com',
      'Case',
      '5',
      [change],
      date
    )
    expect(d).toContain('Notes')
    expect(d).toContain('old note text')
    expect(d).toContain('new note text')
  })

  it('renders em-dash for null values', () => {
    const change: FieldChange = {
      key: 'notes',
      label: 'Notes',
      from: null,
      to: null,
    }
    const d = buildDetails(
      'Alice Smith',
      'alice@example.com',
      'Case',
      '5',
      [change],
      date
    )
    expect(d).toContain('—')
  })

  it('includes all changes when multiple fields are updated', () => {
    const changes: FieldChange[] = [
      { key: 'status', label: 'Status', from: 'Open', to: 'Completed' },
      { key: 'notes', label: 'Notes', from: 'old', to: 'new' },
    ]
    const d = buildDetails(
      'Alice Smith',
      'alice@example.com',
      'Case',
      '5',
      changes,
      date
    )
    expect(d).toContain('Status')
    expect(d).toContain('Notes')
    expect(d).toContain('Open')
    expect(d).toContain('new')
  })
})

// ---------------------------------------------------------------------------
// logActivity (integration)
// ---------------------------------------------------------------------------

describe('logActivity', () => {
  it('passes subject and details to createActivity', async () => {
    await logActivity('alice@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(typeof call.subject).toBe('string')
    expect(typeof call.details).toBe('string')
  })

  it('subject uses display_name, not just first name', async () => {
    await logActivity('alice@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(call.subject).toContain('Alice Smith')
  })

  it('falls back to first_name when display_name is empty', async () => {
    vi.mocked(getContactById).mockResolvedValue(makeContact('', 'Alice'))

    await logActivity('alice@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(call.subject).toContain('Alice')
  })

  it('falls back to email local-part when both display_name and first_name are empty', async () => {
    vi.mocked(getContactById).mockResolvedValue(makeContact('', ''))

    await logActivity('bob@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(call.subject).toContain('bob')
  })

  it('details includes the editor full name and email', async () => {
    await logActivity('alice@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(String(call.details)).toContain('Alice Smith')
    expect(String(call.details)).toContain('alice@example.com')
  })

  it('details includes full from and to values even when subject strips them', async () => {
    const longFrom = 'A'.repeat(80)
    const longTo = 'B'.repeat(80)
    const change: FieldChange = {
      key: 'notes',
      label: 'Notes',
      from: longFrom,
      to: longTo,
    }

    await logActivity('alice@example.com', caseTarget, [change])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(String(call.subject)).not.toContain(longFrom)
    expect(String(call.details)).toContain(longFrom)
    expect(String(call.details)).toContain(longTo)
  })

  it('includes case_id and target_contact_id when target.type is "case"', async () => {
    await logActivity('alice@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(call.case_id).toBe(5)
    expect(call.target_contact_id).toEqual([10])
  })

  it('omits case_id when target.type is "contact"', async () => {
    await logActivity('alice@example.com', contactTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(Object.prototype.hasOwnProperty.call(call, 'case_id')).toBe(false)
  })

  it('sets source_contact_id to the resolved contact id', async () => {
    vi.mocked(resolveOrCreateContactByEmail).mockResolvedValue('42')
    vi.mocked(getContactById).mockResolvedValue(makeContact('Alice Smith'))

    await logActivity('alice@example.com', caseTarget, [statusChange])

    const call = vi.mocked(createActivity).mock.calls[0][0]
    expect(call.source_contact_id).toBe(42)
  })

  it('resolves without throwing when createActivity throws', async () => {
    vi.mocked(createActivity).mockRejectedValue(new Error('CiviCRM down'))

    await expect(
      logActivity('alice@example.com', caseTarget, [statusChange])
    ).resolves.toBeUndefined()
  })

  it('resolves without throwing when resolveOrCreateContactByEmail throws', async () => {
    vi.mocked(resolveOrCreateContactByEmail).mockRejectedValue(
      new Error('Network error')
    )

    await expect(
      logActivity('alice@example.com', caseTarget, [statusChange])
    ).resolves.toBeUndefined()
  })
})
