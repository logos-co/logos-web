import { describe, expect, test } from 'vitest'

import { HEADER_TONE_PROBE_Y, isProbeOverDarkZone } from '../header-tone'

const zone = (top: number, bottom: number) => ({ top, bottom })

describe('isProbeOverDarkZone', () => {
  test('is false when the page marks no dark zones', () => {
    expect(isProbeOverDarkZone([])).toBe(false)
  })

  test('is true while the header probe sits inside a dark zone', () => {
    expect(isProbeOverDarkZone([zone(0, 2406)])).toBe(true)
    expect(isProbeOverDarkZone([zone(-2000, 400)])).toBe(true)
  })

  test('is false once the dark zone has scrolled above the probe', () => {
    expect(isProbeOverDarkZone([zone(-2406, HEADER_TONE_PROBE_Y)])).toBe(false)
    expect(isProbeOverDarkZone([zone(-2406, -10)])).toBe(false)
  })

  test('is false before a dark zone lower on the page reaches the probe', () => {
    expect(isProbeOverDarkZone([zone(HEADER_TONE_PROBE_Y + 1, 900)])).toBe(
      false
    )
  })

  test('checks every zone, not just the first', () => {
    expect(isProbeOverDarkZone([zone(-900, -100), zone(-10, 600)])).toBe(true)
  })
})
