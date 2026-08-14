import { describe, expect, test } from 'vitest'

import { scoutEvidenceFields } from '@/contracts/values'

import {
  carriesPersonalData,
  githubPolicy,
  isPermittedField,
  sourcePolicies,
} from './source-policies'

describe('source policies', () => {
  test('refuses values shaped like a personal contact detail', () => {
    // These are the exact shapes the sources return: a contact address on a
    // GitHub organisation profile, a phone number in a directory listing.
    expect(carriesPersonalData('Write to maintainer@example.org')).toBe(true)
    expect(carriesPersonalData('Call +44 20 7946 0958')).toBe(true)
    expect(carriesPersonalData('Reach us on 07700900123')).toBe(true)
  })

  test('lets ordinary organisational text through', () => {
    expect(
      carriesPersonalData('Open protocol for real-time communication')
    ).toBe(false)
    // A release date is not a phone number, and the check has to know that.
    expect(carriesPersonalData('Latest public change 2026-07-30')).toBe(false)
  })

  test('every policy names the personal data its source can return', () => {
    for (const policy of sourcePolicies) {
      expect(policy.personalDataFields.length).toBeGreaterThan(0)
      expect(policy.allowedHosts.length).toBeGreaterThan(0)
      expect(policy.termsReviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test('no policy permits a field outside the evidence vocabulary', () => {
    for (const policy of sourcePolicies) {
      for (const field of policy.permittedFields) {
        expect(scoutEvidenceFields).toContain(field)
      }
    }
  })

  test('a source contributes only the fields its policy permits', () => {
    expect(isPermittedField(githubPolicy, 'public_repository')).toBe(true)
    // GitHub says nothing reliable about how an organisation is constituted,
    // so it may not be the thing that claims one.
    expect(isPermittedField(githubPolicy, 'governance_model')).toBe(false)
  })
})
