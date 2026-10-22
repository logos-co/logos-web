import { spawnSync } from 'node:child_process'
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
  it('measures proportional word bounds without loading system fonts', () => {
    const moduleUrl = new URL(
      '../../../scripts/zines/extract-text.ts',
      import.meta.url
    ).href
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `import { extractText } from ${JSON.stringify(moduleUrl)};
         const result = extractText(${JSON.stringify(content([line('WWW iii', 20, 100)]))}, 600, 0);
         process.stdout.write(JSON.stringify(result));`,
      ],
      {
        env: { ...process.env, DISABLE_SYSTEM_FONTS_LOAD: '1' },
        encoding: 'utf8',
        timeout: 15_000,
      }
    )
    expect(result.status, result.stderr).toBe(0)
    const extracted: ReturnType<typeof extractText> = JSON.parse(result.stdout)
    expect(extracted.words.map((word) => word.text)).toEqual(['WWW', 'iii'])
    expect(extracted.words[0].x).toBe(20)
    expect(extracted.words[0].width).toBeGreaterThan(extracted.words[1].width)
    for (const word of extracted.words) {
      expect(Number.isFinite(word.x)).toBe(true)
      expect(word.width).toBeGreaterThan(0)
      expect(word.x + word.width).toBeLessThanOrEqual(120.02)
    }
  })

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
  it('keeps a category, headline and subtitle together despite font changes', () => {
    const headline = {
      ...line('The Parallel Society', 14, 70, 178),
      transform: [22, 0, 0, 22, 14, 530],
      height: 22,
    }
    const result = extractText(
      content([
        line('UNDERSTANDING WHOLE SYSTEMS', 14, 50, 120),
        headline,
        line('The historical case for institutions', 14, 90, 267),
        line('First body paragraph', 14, 125, 123),
      ]),
      600,
      0
    )
    expect(result.blocks).toHaveLength(2)
    expect(result.blocks[0]).toMatchObject({ start: 0, end: 11 })
    expect(result.blocks[1].start).toBe(11)
  })
  it('separates a spanning headline from a narrower body column', () => {
    const headline = {
      ...line('Wide heading', 10, 70, 250),
      transform: [22, 0, 0, 22, 10, 530],
      height: 22,
    }
    const result = extractText(
      content([headline, line('Narrow body text', 10, 90, 180)]),
      600,
      0
    )
    expect(result.blocks).toHaveLength(2)
    expect(result.blocks[1]).toMatchObject({ width: 180, start: 2, end: 5 })
  })
})
