import { describe, expect, it } from 'vitest'

import messages from '../../messages/en.json' with { type: 'json' }

describe('homepage about copy', () => {
  it('keeps the homepage about copy keys present and non-empty', () => {
    // Copy wording is allowed to change freely; we only guard the structure
    // so the about section never renders with missing/blank text.
    for (const key of [
      'intro',
      'closing1',
      'closing2',
      'closing3',
    ] as const) {
      expect(typeof messages.home.about[key]).toBe('string')
      expect(messages.home.about[key].trim().length).toBeGreaterThan(0)
    }
  })
})
