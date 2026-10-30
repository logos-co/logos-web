import { describe, expect, it } from 'vitest'
import {
  convertArticle,
  rewriteLink,
} from '../../scripts/waku-migration/convert'

const source = (body: string) => `---
title: Original title
slug: example
date: 2024-03-04
authors: writer
categories: waku, tutorials
---
${body}`
const convert = (body: string) =>
  convertArticle('example.mdx', source(body), new Set(['example', 'other']), {
    writer: { name: 'Original author' },
  })

describe('Waku article conversion', () => {
  it('preserves literal code, prose, tables, image captions and author/date metadata', () => {
    const article = convert(
      'Introduction.\n\n# Heading\n\n```jsx\nimport App from "./App"\n<App value={1} />\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<figure><img src="/img/a.png" alt="Diagram" /><figcaption>Original caption</figcaption></figure>'
    )
    expect(article.body).toContain('<h2 id="heading">Heading</h2>')
    expect(article.body).not.toContain('<h1')
    expect(article.body).toContain('<table>')
    expect(article.body).toContain('<figcaption>Original caption</figcaption>')
    expect(article.body).toContain('alt="Diagram"')
    expect(article.codeBlocks).toEqual([
      'import App from "./App"\n<App value={1} />\n',
    ])
    expect(article.authors).toEqual(['Original author'])
    expect(article.publish_date).toBe('2024-03-04')
    expect(article.summary).toBe('Introduction.')
    expect(article.markdown_body).toContain('<App value={1} />')
  })
  it('excludes the Spanish switch without stripping imports from code examples', () => {
    const article = convert(
      `import { Button } from '@acid-info/lsd-react'\n\n<a href="/es/build-dapps-using-waku">\n<Button>Read in Spanish</Button>\n</a>\n<br /><br />\n\nEnglish body.\n\n\`\`\`js\nimport Button from './Button'\n\`\`\``
    )
    expect(article.body).not.toContain('Spanish')
    expect(article.body).not.toContain('/es/')
    expect(article.body).toContain('English body.')
    expect(article.codeBlocks).toEqual(["import Button from './Button'\n"])
  })
  it('rewrites only migrated article links and keeps queries and fragments', () => {
    const slugs = new Set(['other'])
    expect(
      rewriteLink('https://blog.waku.org/other/?ref=waku#heading', slugs)
    ).toBe('/media/article/other?ref=waku#heading')
    expect(rewriteLink('/missing', slugs)).toBe('https://blog.waku.org/missing')
    expect(rewriteLink('https://waku.org/docs', slugs)).toBe(
      'https://waku.org/docs'
    )
    expect(rewriteLink('#heading', slugs)).toBe('#heading')
  })
})
