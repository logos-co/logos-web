import { existsSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  getSocialProofCards,
  HOME_USE_CASE_CARDS,
} from '@/lib/homepage-section-data'

const repoRoot = path.resolve(import.meta.dirname, '../../../..')

describe('homepage review contracts', () => {
  test('maps social proof cards to the stats that match their labels', () => {
    const cards = getSocialProofCards(
      {
        contributions: '3,441',
        contributors: '218',
        repositories: '341',
      },
      (key) => key
    )

    expect(cards).toContainEqual(
      expect.objectContaining({
        key: 'contributions',
        value: '218',
        label: 'contributions.label',
      })
    )
    expect(cards).toContainEqual(
      expect.objectContaining({
        key: 'circles',
        value: '47',
        label: 'circles.label',
      })
    )
  })

  test('uses a distinct existing image asset for every use-case card', () => {
    const images = HOME_USE_CASE_CARDS.map((card) => card.image)

    expect(new Set(images).size).toBe(HOME_USE_CASE_CARDS.length)
    HOME_USE_CASE_CARDS.forEach((card) => {
      expect(card.image).toBe(`/images/home/use-cases/${card.key}.png`)
      expect(
        existsSync(path.join(repoRoot, 'apps/web/public', card.image))
      ).toBe(true)
    })
  })
})
