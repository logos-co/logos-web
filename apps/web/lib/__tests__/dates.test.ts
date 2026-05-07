import { describe, expect, it } from 'vitest'

import {
  formatDateLong,
  formatDateMdy2,
  formatTzOffsetLabel,
} from '../dates'

describe('formatDateMdy2', () => {
  it('formats a UTC midnight as MM.DD.YY', () => {
    expect(formatDateMdy2('2025-01-15T00:00:00Z')).toBe('01.15.25')
  })

  it('uses 2-digit year for two-millennium dates', () => {
    expect(formatDateMdy2('1999-12-31T00:00:00Z')).toBe('12.31.99')
  })

  it('treats input as UTC even when timezone differs', () => {
    // 23:30 UTC on 2025-01-14 is still Jan 14 in UTC, regardless of host TZ.
    expect(formatDateMdy2('2025-01-14T23:30:00Z')).toBe('01.14.25')
  })
})

describe('formatDateLong', () => {
  it('formats a UTC date as `Mon DD, YYYY`', () => {
    expect(formatDateLong('2025-01-15T00:00:00Z')).toBe('Jan 15, 2025')
  })

  it('returns the input string verbatim when not parseable', () => {
    expect(formatDateLong('not-a-date')).toBe('not-a-date')
  })
})

describe('formatTzOffsetLabel', () => {
  it('returns a non-empty label for a known timezone', () => {
    // Don't pin the exact label (varies by ICU version); ensure non-empty.
    const label = formatTzOffsetLabel(
      'America/Los_Angeles',
      '2025-06-01T12:00:00Z',
    )
    expect(label.length).toBeGreaterThan(0)
  })

  it('falls back to the input zone when nothing comes back', () => {
    expect(formatTzOffsetLabel('NotAZone', '2025-01-01T00:00:00Z')).toBe(
      'NotAZone',
    )
  })
})
