import { describe, expect, test } from 'vitest'

import type { ScoutEvidence } from '@/contracts/scout'

import { assessCandidate, reviewOrder } from './scout-rubric'

const DAY = 24 * 60 * 60 * 1000
const now = Date.UTC(2026, 7, 15)

function evidence(overrides: Partial<ScoutEvidence> = {}): ScoutEvidence {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    field: 'theme_match',
    value: 'Censorship-resistant messaging',
    sourceUrl: 'https://halcyonrelay.example/about',
    sourceTitle: 'About',
    extractionMethod: 'synthetic',
    extractorVersion: 'synthetic-fixture-v1',
    certainty: 'exact',
    excerpt: 'We build metadata-resistant message routing.',
    observedAt: new Date(now - 2 * DAY).toISOString(),
    expiresAt: new Date(now + 90 * DAY).toISOString(),
    supersededAt: null,
    ...overrides,
  }
}

describe('scout rubric', () => {
  test('bands a dimension strong when a live source states it exactly', () => {
    const result = assessCandidate(
      [
        evidence(),
        evidence({
          field: 'official_site',
          sourceUrl: 'https://halcyonrelay.example/',
        }),
      ],
      now
    )

    const relevance = result.dimensions.find(
      (item) => item.dimension === 'technical_relevance'
    )

    expect(relevance?.band).toBe('strong')
    expect(result.gate).toBe('sufficient')
  })

  test('refuses to assess fit from a single source', () => {
    const result = assessCandidate(
      [evidence(), evidence({ field: 'public_repository' })],
      now
    )

    expect(result.distinctSources).toBe(1)
    expect(result.gate).toBe('insufficient')
    expect(result.gateReason).toContain('independent sources')
  })

  test('reports the field two live sources disagree about', () => {
    const result = assessCandidate(
      [
        evidence({
          field: 'governance_model',
          value: 'Registered cooperative',
          sourceUrl: 'https://quorumfield.example/about',
        }),
        evidence({
          field: 'governance_model',
          value: 'Private company limited by shares',
          sourceUrl: 'https://registry.example/quorum-field',
        }),
      ],
      now
    )

    expect(result.gate).toBe('conflicted')
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0]?.field).toBe('governance_model')
    expect(result.conflicts[0]?.values).toHaveLength(2)
  })

  test('ignores expired and superseded observations', () => {
    const result = assessCandidate(
      [
        evidence({ expiresAt: new Date(now - DAY).toISOString() }),
        evidence({
          field: 'public_repository',
          sourceUrl: 'https://code.example/repo',
          supersededAt: new Date(now - DAY).toISOString(),
        }),
      ],
      now
    )

    expect(result.distinctSources).toBe(0)
    expect(
      result.dimensions.every((item) => item.band === 'unevidenced')
    ).toBe(true)
    expect(result.gate).toBe('insufficient')
  })

  test('drops a stale observation to weak rather than dropping it', () => {
    const result = assessCandidate(
      [
        evidence({ observedAt: new Date(now - 300 * DAY).toISOString() }),
        evidence({
          field: 'official_site',
          sourceUrl: 'https://halcyonrelay.example/',
        }),
      ],
      now
    )

    const relevance = result.dimensions.find(
      (item) => item.dimension === 'technical_relevance'
    )

    expect(relevance?.band).toBe('weak')
    expect(relevance?.reason).toContain('older than')
  })

  test('a derived value cannot reach the strong band', () => {
    const result = assessCandidate(
      [
        evidence({ certainty: 'derived' }),
        evidence({
          field: 'official_site',
          sourceUrl: 'https://halcyonrelay.example/',
        }),
      ],
      now
    )

    expect(
      result.dimensions.find(
        (item) => item.dimension === 'technical_relevance'
      )?.band
    ).toBe('moderate')
  })

  test('puts conflicts above ready candidates in the queue', () => {
    expect(reviewOrder('conflicted')).toBeLessThan(reviewOrder('sufficient'))
    expect(reviewOrder('sufficient')).toBeLessThan(reviewOrder('insufficient'))
    expect(reviewOrder('insufficient')).toBeLessThan(reviewOrder(null))
  })

  test('produces no total, only bands and a gate', () => {
    const result = assessCandidate([evidence()], now)

    // The absence is the design: a single figure would be compared between
    // candidates whose evidence has nothing in common, and would end up
    // standing in for the partnership decision.
    expect(Object.keys(result)).not.toContain('total')
    expect(Object.keys(result)).not.toContain('score')
  })
})
