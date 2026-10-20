import { describe, expect, it } from 'vitest'
import { zineTextLayerSchema, type ZineDocument } from '@repo/content/schemas'
import source from '../../../scripts/zines/text-layers/open-source.json'
import { searchDocument } from '../reader-state'

const layer = zineTextLayerSchema.parse(source)
const document: ZineDocument = {
  schemaVersion: 1,
  slug: 'open-source',
  sourceHash: layer.sourceHash,
  pages: layer.pages.map((page, number) => ({
    ...page,
    number,
    width: 600,
    height: 900,
  })),
}

describe('reviewed Open Source Everything text', () => {
  it('finds corrected words, restored captions and phrases across repaired columns', () => {
    for (const [page, query] of [
      [4, 'is not just a collection'],
      [7, 'effective-yet-self-sovereign'],
      [13, 'self-selection'],
      [15, 'digital-first'],
      [17, 'We route around the damage. We create private relays.'],
      [17, 'and these lower entry barriers attract yet more users.'],
      [17, 'Estimated Daily Users'],
      [19, "Don't Think Users."],
      [19, 'Think Tribe.'],
      [21, 'How do We do it?'],
      [27, 'because no one is an island'],
      [28, 'local chapters of the Logos network.'],
      [28, 'ask in the Logos Discord if there is already a Circle near you.'],
      [28, 'Find your people'],
    ] as const) {
      expect(searchDocument(document, query), query).toEqual(
        expect.arrayContaining([expect.objectContaining({ page })])
      )
    }
  })

  it('removes picture noise and keeps complete quotations in reading order', () => {
    for (const page of [3, 16]) {
      expect(layer.pages[page].words).toEqual([])
      expect(layer.pages[page].blocks).toEqual([])
    }
    expect(layer.pages[21].words.map((word) => word.text).join(' ')).toBe(
      'How do We do it?'
    )
    expect(layer.pages[25].words).toHaveLength(4)
    expect(layer.pages[27].words.map((word) => word.text).join(' ')).toBe(
      'No one is free until we are all free, because no one is an island – we are all pieces of the main. 28'
    )
    const circles = layer.pages[28].words.map((word) => word.text).join(' ')
    expect(circles.indexOf('Why Logos Circles?')).toBeLessThan(
      circles.indexOf('How can I help?')
    )
  })

  it('keeps reading blocks valid after word deletion, joins and reordering', () => {
    for (const page of layer.pages) {
      let end = 0
      for (const block of page.blocks) {
        expect(block.start).toBeGreaterThanOrEqual(end)
        expect(block.end).toBeGreaterThan(block.start)
        expect(block.end).toBeLessThanOrEqual(page.words.length)
        for (const word of page.words.slice(block.start, block.end)) {
          expect(word.x).toBeGreaterThanOrEqual(block.x - 0.02)
          expect(word.y).toBeGreaterThanOrEqual(block.y - 0.02)
          expect(word.x + word.width).toBeLessThanOrEqual(
            block.x + block.width + 0.02
          )
          expect(word.y + word.height).toBeLessThanOrEqual(
            block.y + block.height + 0.02
          )
        }
        end = block.end
      }
    }
  })
})
