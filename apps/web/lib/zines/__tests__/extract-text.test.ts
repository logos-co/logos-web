import { describe, expect, it } from 'vitest'
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api'
import { extractText } from '../../../scripts/zines/extract-text'

const line = (str: string, x: number, y: number, width = 100): TextItem => ({
  str,
  dir: 'ltr',
  width,
  height: 10,
  transform: [10, 0, 0, 10, x, 600 - y],
  fontName: 'test',
  hasEOL: true,
})
const content = (items: TextItem[]): TextContent => ({
  items,
  styles: {},
  lang: null,
})

describe('PDF text extraction', () => {
  it('keeps headers selectable and groups inline runs with their paragraph', () => {
    const result = extractText(
      content([
        line('HEADER', 10, 20),
        line('First', 10, 100, 25),
        line('bold run', 38, 100, 40),
        line('second line', 10, 112),
        line('new paragraph', 10, 145),
        line('next column', 150, 100),
      ]),
      600,
      0
    )
    expect(result.words.map((word) => word.text)).toEqual([
      'HEADER',
      'First',
      'bold',
      'run',
      'second',
      'line',
      'new',
      'paragraph',
      'next',
      'column',
    ])
    expect(result.blocks.map(({ start, end }) => ({ start, end }))).toEqual([
      { start: 1, end: 6 },
      { start: 6, end: 8 },
      { start: 8, end: 10 },
    ])
  })
  it('removes print bleed from text coordinates and skips empty PDF runs', () => {
    const result = extractText(
      content([line('hello world', 20, 100), line(' ', 20, 120)]),
      600,
      9
    )
    expect(result.words[0]).toMatchObject({
      text: 'hello',
      x: 11,
      y: 83,
      height: 10,
    })
    expect(result.words).toHaveLength(2)
    expect(result.blocks[0].start).toBe(0)
    expect(result.blocks[0].end).toBe(2)
  })
  it('includes outdented and centred lines in the guided crop', () => {
    const result = extractText(
      content([
        line('Indented opening', 18, 100, 100),
        line('Full width second line', 10, 112, 115),
        line('Centred final line', 14, 124, 100),
      ]),
      600,
      0
    )
    expect(result.blocks).toHaveLength(1)
    const block = result.blocks[0]
    for (const word of result.words) {
      expect(word.x).toBeGreaterThanOrEqual(block.x)
      expect(word.x + word.width).toBeLessThanOrEqual(
        block.x + block.width + 0.02
      )
      expect(word.y + word.height).toBeLessThanOrEqual(
        block.y + block.height + 0.02
      )
    }
  })
})
