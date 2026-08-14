import { describe, expect, test } from 'vitest'

import { describesSameEntity } from './reference-source'

describe('reference entity matching', () => {
  test('refuses an entry about a different subject with a similar name', () => {
    // The real failure this exists for: a censorship-resistant networking
    // project looked up in a reference work returns a Sheffield record label.
    expect(describesSameEntity('Warpnet', 'Warp (record label)')).toBe(false)
  })

  test('accepts an entry whose title contains the organisation', () => {
    expect(describesSameEntity('Matrix', 'Matrix (protocol)')).toBe(true)
    // Punctuation and case are noise; "Element Software" and the article
    // "Element (software)" normalise to the same string.
    expect(describesSameEntity('Element Software', 'Element (software)')).toBe(
      true
    )
  })

  test('refuses two different things that share a first word', () => {
    expect(
      describesSameEntity('Element Collective', 'Element (software)')
    ).toBe(false)
  })

  test('accepts a longer name that contains the entry title', () => {
    expect(describesSameEntity('Zcash Foundation', 'Zcash')).toBe(true)
  })

  test('refuses names too short to be distinctive', () => {
    expect(describesSameEntity('IPFS', 'IPF')).toBe(false)
    expect(describesSameEntity('Go', 'Go (programming language)')).toBe(false)
  })
})
