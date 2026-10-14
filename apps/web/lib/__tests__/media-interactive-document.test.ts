import { describe, expect, it } from 'vitest'

import { buildInteractiveDocument } from '../media-interactive-document'

describe('buildInteractiveDocument', () => {
  it('preserves a full document and its body attributes, styles and scripts', () => {
    const fullHtml =
      '<!doctype html><html lang="en"><head><style>body{font-family:Georgia}</style></head><body class="article" style="padding:24px"><h1>Article</h1><script>window.articleReady=true</script></body></html>'
    const html = buildInteractiveDocument(fullHtml)

    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<style>body{font-family:Georgia}</style>')
    expect(html).toContain('<body class="article" style="padding:24px">')
    expect(html).toContain('<script>window.articleReady=true</script>')
    expect(html.match(/<body\b/g)).toHaveLength(1)
    expect(html).toContain('http-equiv="Content-Security-Policy"')
  })

  it('retains an explicit document CSP', () => {
    const csp =
      '<meta http-equiv="Content-Security-Policy" content="default-src https:">'
    const html = buildInteractiveDocument(
      `<html><head>${csp}</head><body>Article</body></html>`
    )
    expect(html.match(/Content-Security-Policy/g)).toHaveLength(1)
    expect(html).toContain(csp)
    expect(html).not.toContain('<script')
  })

  it('keeps legacy blog links pointing at the migrated article', () => {
    const html = buildInteractiveDocument(
      '<a href="https://blog.logos.co/article/example">Read</a><a href="#notes">Notes</a>'
    )
    expect(html).toContain('href="/media/article/example"')
    expect(html).toContain('href="#notes"')
  })
})
