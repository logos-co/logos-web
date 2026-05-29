import { describe, expect, test } from 'vitest'

import { DURATION, fadeUp, heroFadeUp, scaleIn, stagger } from '@/lib/motion'

describe('motion tokens', () => {
  test('uses restrained reveal movement for content and cards', () => {
    expect(fadeUp.hidden).toMatchObject({ opacity: 0, y: 12 })
    expect(heroFadeUp.hidden).toMatchObject({ opacity: 0, y: 20 })
    expect(scaleIn.hidden).toMatchObject({ opacity: 0, scale: 0.985 })
  })

  test('keeps reveal timing subtle and tightly staggered', () => {
    expect(DURATION.base).toBe(0.75)
    expect(DURATION.hero).toBe(1)
    expect(stagger.visible).toMatchObject({
      transition: { staggerChildren: 0.08, delayChildren: 0.08 },
    })
  })
})
