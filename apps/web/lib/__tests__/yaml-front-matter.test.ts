import { describe, expect, it } from 'vitest'

import { parseYamlFrontMatter } from '../yaml-front-matter'

describe('parseYamlFrontMatter', () => {
  it.each(['---', '---yaml', '--- yml'])(
    'parses YAML metadata and preserves the body after %s',
    (delimiter) => {
      const content = '# Heading\r\n\r\nBody'
      const raw = `\uFEFF${delimiter}\r\ntitle: Example\r\n---\r\n${content}`

      expect(parseYamlFrontMatter(raw)).toEqual({
        data: { title: 'Example' },
        content,
      })
    }
  )

  it('preserves Markdown without front matter', () => {
    const content = '# Example\n\n---\n\nBody'
    expect(parseYamlFrontMatter(content)).toEqual({ data: {}, content })
  })

  it.each(['---js', '--- javascript', '---json'])(
    'rejects metadata labelled %s before choosing a parser',
    (delimiter) => {
      const raw = `${delimiter}\ntitle: Example\n---\n# Heading`
      expect(() => parseYamlFrontMatter(raw)).toThrow(
        'Only YAML front matter is supported'
      )
    }
  )
})
