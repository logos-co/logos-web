import { describe, expect, test } from 'vitest'

import { caseStatuses, caseStatusTransitions } from './values'

describe('case status transitions', () => {
  test('every status has an entry', () => {
    for (const status of caseStatuses) {
      expect(caseStatusTransitions[status]).toBeDefined()
    }
  })

  test('every destination is a known status', () => {
    for (const targets of Object.values(caseStatusTransitions)) {
      for (const target of targets) {
        expect(caseStatuses).toContain(target)
      }
    }
  })

  test('no status transitions to itself', () => {
    for (const [status, targets] of Object.entries(caseStatusTransitions)) {
      expect(targets).not.toContain(status)
    }
  })

  test('closed is terminal', () => {
    expect(caseStatusTransitions.closed).toHaveLength(0)
  })

  test('every open status can reach closed', () => {
    const open = caseStatuses.filter((status) => status !== 'closed')
    for (const status of open) {
      expect(caseStatusTransitions[status]).toContain('closed')
    }
  })

  test('a resolved case can be reopened for follow-up', () => {
    expect(caseStatusTransitions.resolved).toContain('in_progress')
  })
})
