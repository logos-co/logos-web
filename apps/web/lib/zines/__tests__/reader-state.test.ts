import { describe, expect, it } from 'vitest'
import {
  nextPage,
  readState,
  searchDocument,
  visiblePages,
} from '../reader-state'
import type { ZineDocument } from '@repo/content/schemas'

const document: ZineDocument = {
  schemaVersion: 1,
  slug: 'test',
  sourceHash: 'test',
  pages: [
    {
      number: 0,
      width: 420,
      height: 595,
      blocks: [],
      words: [
        'The',
        'parallel',
        'society.',
        'Parallel',
        'institutions',
        '[test]',
      ].map((text, index) => ({
        text,
        x: index * 10,
        y: 10,
        width: 10,
        height: 10,
      })),
    },
  ],
}

describe('zine navigation', () => {
  it('maps printed pages to spreads without pairing either cover', () => {
    expect(visiblePages(0, 32, true)).toEqual([0])
    expect(visiblePages(4, 32, true)).toEqual([3, 4])
    expect(visiblePages(30, 32, true)).toEqual([29, 30])
    expect(visiblePages(31, 32, true)).toEqual([31])
    expect(visiblePages(4, 32, false)).toEqual([4])
  })
  it('navigates through both covers and clamps issue boundaries', () => {
    expect(nextPage(0, 32, true, -1)).toBe(0)
    expect(nextPage(0, 32, true, 1)).toBe(1)
    expect(nextPage(4, 32, true, 1)).toBe(5)
    expect(nextPage(3, 32, true, -1)).toBe(2)
    expect(nextPage(30, 32, true, 1)).toBe(31)
    expect(nextPage(31, 32, true, 1)).toBe(31)
  })
  it('normalises malformed and out-of-range deep links', () => {
    expect(readState('?page=-1&view=unknown&block=NaN', 32)).toMatchObject({
      page: 0,
      view: 'spreads',
      block: 0,
    })
    expect(readState('?page=999&view=pages&start=5&end=9', 32)).toMatchObject({
      page: 31,
      view: 'pages',
      start: 5,
      end: 9,
    })
    expect(
      readState('?page=4&q=parallel&view=guided&block=12', 32)
    ).toMatchObject({ page: 4, query: 'parallel', view: 'guided', block: 12 })
  })
})

describe('zine search', () => {
  it('finds case-insensitive matches and their word ranges', () => {
    expect(
      searchDocument(document, 'PARALLEL').map(({ page, start, end }) => ({
        page,
        start,
        end,
      }))
    ).toEqual([
      { page: 0, start: 1, end: 2 },
      { page: 0, start: 3, end: 4 },
    ])
  })
  it('matches phrases across words and treats special characters literally', () => {
    expect(searchDocument(document, 'parallel   society')[0]).toMatchObject({
      start: 1,
      end: 3,
      match: 'parallel society',
    })
    expect(searchDocument(document, '[test]')).toHaveLength(1)
    expect(searchDocument(document, '   ')).toEqual([])
    expect(searchDocument(document, 'absent')).toEqual([])
  })
  it('keeps snippets inside their reading block without leaking headers', () => {
    const grouped: ZineDocument = {
      ...document,
      pages: [
        {
          ...document.pages[0],
          blocks: [
            { x: 0, y: 10, width: 30, height: 10, start: 0, end: 3 },
            { x: 30, y: 10, width: 30, height: 10, start: 3, end: 6 },
          ],
        },
      ],
    }
    const hits = searchDocument(grouped, 'parallel')
    expect(hits[0].after.trim()).toBe('society.')
    expect(hits[1].before).toBe('')
    expect(hits[1].after.trim()).toBe('institutions [test]')
  })
})
