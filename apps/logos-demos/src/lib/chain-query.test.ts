import { describe, expect, it } from 'vitest'

import { isChainId, MAX_CHAIN_ID_LENGTH } from './chain-query'

describe('isChainId', () => {
  it('accepts hex ids', () => {
    expect(isChainId('a1B2c3')).toBe(true)
    expect(isChainId('f'.repeat(MAX_CHAIN_ID_LENGTH))).toBe(true)
  })

  it('refuses anything that could change the node URL', () => {
    for (const value of [
      '',
      '../network/info#',
      'abc/def',
      'abc?x=1',
      'abc#frag',
      '%2e%2e',
      'abc def',
      'xyz',
      'f'.repeat(MAX_CHAIN_ID_LENGTH + 1),
    ]) {
      expect(isChainId(value)).toBe(false)
    }
  })
})
