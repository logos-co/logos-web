import { describe, expect, it } from 'vitest'

import messages from '../../messages/en.json' with { type: 'json' }

describe('homepage about copy', () => {
  it('preserves the existing homepage about copy', () => {
    expect(messages.home.about.intro).toBe(
      'Civil society is in decline. Our institutions are failing. Our money is debased. People are atomised, indebted, and increasingly unable to provide for themselves or their families. Reform from within cannot reverse this because the system selects for adherence, and centralisation leads inevitably to corruption.'
    )
    expect(messages.home.about.closing1).toBe(
      'Logos exist to build the decentralised infrastructure and living ecosystem that makes a parallel society possible for anyone ready to reclaim their agency in the digital and physical world.'
    )
    expect(messages.home.about.closing2).toBe('Sovereign, sound, and civic.')
    expect(messages.home.about.closing3).toBe(
      'Built for exit when the existing order can no longer hold.'
    )
  })
})
