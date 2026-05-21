import { describe, expect, it } from 'vitest'
import { computeScorecard } from './scorecard'

describe('computeScorecard', () => {
  it('returns null when all values are null', () => {
    expect(computeScorecard({ a: null, b: null })).toBeNull()
  })

  it('averages non-null values', () => {
    expect(computeScorecard({ a: 4, b: 2, c: null })).toBe(3)
  })

  it('rounds to two decimal places', () => {
    expect(computeScorecard({ a: 1, b: 2, c: 3 })).toBe(2)
    expect(computeScorecard({ a: 1, b: 2, c: 4 })).toBe(2.33)
  })

  it('handles a single non-null value', () => {
    expect(computeScorecard({ a: 5, b: null })).toBe(5)
  })
})
