import { describe, expect, test } from 'vitest'

import { reportQuerySchema } from './report'

describe('report query contract', () => {
  const base = {
    cohortFrom: '2026-06-01T00:00:00.000Z',
    cohortTo: '2026-06-30T00:00:00.000Z',
    asOf: '2026-06-15T00:00:00.000Z',
    timezone: 'UTC',
  }

  test('accepts a well-formed query', () => {
    expect(reportQuerySchema.safeParse(base).success).toBe(true)
  })

  test('defaults the bucket rather than leaving it undefined', () => {
    const parsed = reportQuerySchema.parse(base)
    expect(parsed.bucket).toBe('week')
  })

  test('rejects as_of before the cohort start', () => {
    const parsed = reportQuerySchema.safeParse({
      ...base,
      asOf: '2026-05-01T00:00:00.000Z',
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects as_of in the future', () => {
    const parsed = reportQuerySchema.safeParse({
      ...base,
      cohortTo: '2099-01-01T00:00:00.000Z',
      asOf: '2099-01-01T00:00:00.000Z',
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects an inverted cohort window', () => {
    const parsed = reportQuerySchema.safeParse({
      ...base,
      cohortFrom: '2026-06-30T00:00:00.000Z',
      cohortTo: '2026-06-01T00:00:00.000Z',
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects an unknown timezone', () => {
    const parsed = reportQuerySchema.safeParse({
      ...base,
      timezone: 'Mars/Olympus_Mons',
    })
    expect(parsed.success).toBe(false)
  })
})
