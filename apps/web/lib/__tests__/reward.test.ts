import { describe, expect, it } from 'vitest'

import { formatReward, formatRewardLines } from '../reward'

describe('formatReward', () => {
  it('returns null when reward is undefined', () => {
    expect(formatReward(undefined)).toBeNull()
  })

  it('formats amount + currency without xp', () => {
    expect(formatReward({ amount: 2500, currency: 'USDC' })).toBe('2500 USDC')
  })

  it('appends xp when present', () => {
    expect(
      formatReward({ amount: 2500, currency: 'USDC', xp: 1000 }),
    ).toBe('2500 USDC + 1000 XP')
  })
})

describe('formatRewardLines', () => {
  it('returns empty array when reward is undefined', () => {
    expect(formatRewardLines(undefined)).toEqual([])
  })

  it('returns single line for amount-only', () => {
    expect(formatRewardLines({ amount: 2500, currency: 'USDC' })).toEqual([
      '2500 USDC',
    ])
  })

  it('returns two lines when xp is present', () => {
    expect(
      formatRewardLines({ amount: 2500, currency: 'USDC', xp: 1000 }),
    ).toEqual(['2500 USDC', '+ 1000 XP'])
  })
})
