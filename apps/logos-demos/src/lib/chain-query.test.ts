import { describe, expect, it } from 'vitest'

import { isChainId } from './chain-query'

const ID = 'a1B2c3d4'.repeat(8)

describe('isChainId', () => {
  it('accepts 32-byte hex ids, with or without 0x', () => {
    expect(isChainId(ID)).toBe(true)
    expect(isChainId(`0x${ID}`)).toBe(true)
  })

  it('refuses anything that could change the node URL', () => {
    for (const value of [
      '',
      '../network/info#',
      `${ID}/../../network/info`,
      `${ID}?x=1`,
      `${ID}#frag`,
      `${ID}\n`,
      `\n${ID}`,
      '%2e%2e',
      'z'.repeat(64),
      ID.slice(1),
      `${ID}0`,
    ]) {
      expect(isChainId(value)).toBe(false)
    }
  })
})
