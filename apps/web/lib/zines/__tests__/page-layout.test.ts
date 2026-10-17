import { describe, expect, it } from 'vitest'
import {
  printPageCrops,
  extractPageText,
} from '../../../scripts/zines/page-layout'
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api'

describe('print PDF page order', () => {
  it('preserves single pages and separates facing pages left to right', () => {
    expect(printPageCrops(420, 600, 9)).toEqual([
      { x: 9, y: 9, width: 402, height: 582 },
    ])
    expect(printPageCrops(1190, 842, 0)).toEqual([
      { x: 0, y: 0, width: 595, height: 842 },
      { x: 595, y: 0, width: 595, height: 842 },
    ])
  })
  it('keeps searchable words on their own page and translates their positions', () => {
    const item = (str: string, x: number): TextItem => ({
      str,
      dir: 'ltr',
      width: 60,
      height: 10,
      transform: [10, 0, 0, 10, x, 600],
      fontName: 'test',
      hasEOL: true,
    })
    const content: TextContent = {
      items: [item('Left page', 40), item('Right page', 635)],
      styles: {},
      lang: null,
    }
    const crops = printPageCrops(1190, 842, 0)
    expect(
      extractPageText(content, 842, crops[0]).words.map((w) => w.text)
    ).toEqual(['Left', 'page'])
    const right = extractPageText(content, 842, crops[1])
    expect(right.words.map((w) => w.text)).toEqual(['Right', 'page'])
    expect(right.words[0].x).toBe(40)
    expect(right.blocks[0].start).toBe(0)
  })
})
