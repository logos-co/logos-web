import { describe, expect, test } from 'vitest'

import { isSafeHref, parseRichText, richTextToPlain } from './rich-text'

describe('block parsing', () => {
  test('splits paragraphs on a blank line', () => {
    const blocks = parseRichText('First note.\n\nSecond note.')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ type: 'paragraph' })
  })

  test('joins wrapped lines into one paragraph', () => {
    const blocks = parseRichText('A note that was\nwrapped by the editor.')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({
      children: [{ value: 'A note that was wrapped by the editor.' }],
    })
  })

  test('reads bullet lists', () => {
    const blocks = parseRichText('- one\n- two\n- three')
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false })
    expect(blocks[0]).toHaveProperty('items.length', 3)
  })

  test('reads numbered lists', () => {
    const blocks = parseRichText('1. one\n2. two')
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: true })
  })

  test('keeps a bullet list and a numbered list separate', () => {
    const blocks = parseRichText('- one\n1. two')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ ordered: false })
    expect(blocks[1]).toMatchObject({ ordered: true })
  })

  test('reads headings and quotes', () => {
    const blocks = parseRichText('## Call notes\n> They asked about Waku.')
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 2 })
    expect(blocks[1]).toMatchObject({ type: 'quote' })
  })

  test('an empty body produces no blocks', () => {
    expect(parseRichText('')).toEqual([])
    expect(parseRichText('\n\n')).toEqual([])
  })
})

describe('inline parsing', () => {
  test('reads bold and italic', () => {
    const [block] = parseRichText('**bold** and _italic_')
    expect(block).toMatchObject({
      children: [
        { type: 'strong' },
        { type: 'text', value: ' and ' },
        { type: 'emphasis' },
      ],
    })
  })

  test('reads inline code without parsing inside it', () => {
    const [block] = parseRichText('run `pnpm **build**`')
    expect(block).toMatchObject({
      children: [{ type: 'text' }, { type: 'code', value: 'pnpm **build**' }],
    })
  })

  test('reads links and images', () => {
    const [link] = parseRichText('see [the brief](https://example.org/brief)')
    expect(link).toMatchObject({
      children: [
        { type: 'text' },
        { type: 'link', href: 'https://example.org/brief' },
      ],
    })

    const [image] = parseRichText('![screenshot](https://example.org/a.png)')
    expect(image).toMatchObject({
      children: [{ type: 'image', alt: 'screenshot' }],
    })
  })
})

describe('link safety', () => {
  test('accepts the schemes a note can legitimately carry', () => {
    expect(isSafeHref('https://example.org')).toBe(true)
    expect(isSafeHref('http://example.org')).toBe(true)
    expect(isSafeHref('mailto:a@example.org')).toBe(true)
  })

  test('refuses schemes that execute', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false)
    expect(isSafeHref('  JavaScript:alert(1)')).toBe(false)
    expect(isSafeHref('data:text/html,<script>')).toBe(false)
    expect(isSafeHref('/relative')).toBe(false)
  })

  test('renders an unsafe link as text rather than dropping it', () => {
    const [block] = parseRichText('[click](javascript:alert(1))')
    expect(block).toMatchObject({
      children: [{ type: 'text', value: '[click](javascript:alert(1))' }],
    })
  })

  test('never produces a link or image node for an unsafe href', () => {
    const blocks = parseRichText(
      '![x](data:text/html;base64,PHNjcmlwdD4=)\n\n[y](vbscript:msgbox)'
    )
    const flat = JSON.stringify(blocks)
    expect(flat).not.toContain('"image"')
    expect(flat).not.toContain('"link"')
  })
})

describe('plain text', () => {
  test('strips the markup for an excerpt', () => {
    expect(
      richTextToPlain(
        '## Call\n- **bold** point\n- [link](https://example.org)'
      )
    ).toBe('Call bold point link')
  })
})
