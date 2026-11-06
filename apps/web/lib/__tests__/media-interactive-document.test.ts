import { describe, expect, it } from 'vitest'

import { buildInteractiveDocument } from '../media-interactive-document'
import { INTERACTIVE_FRAME_SCRIPT } from '../media-interactive-frame'

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
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html).toContain(`<head>${INTERACTIVE_FRAME_SCRIPT}${csp}`)
  })

  it.each([
    [
      '<!doctype html><html lang="en"><meta http-equiv="Content-Security-Policy" content="default-src https:"><body>Article</body></html>',
      '<html lang="en">',
    ],
    ['<header>Top</header><p>Article</p>', '<head><meta charset="utf-8" />'],
  ])('injects the frame integration once into %s', (fullHtml, before) => {
    const html = buildInteractiveDocument(fullHtml)
    expect(html.split(INTERACTIVE_FRAME_SCRIPT)).toHaveLength(2)
    expect(html).toContain(fullHtml.match(/<(body|header)>[^<]*/)![0])
    expect(html.indexOf(before)).toBeLessThan(
      html.indexOf(INTERACTIVE_FRAME_SCRIPT)
    )
  })

  it('keeps legacy blog links pointing at the migrated article', () => {
    const html = buildInteractiveDocument(
      '<a href="https://blog.logos.co/article/example">Read</a><a href="#notes">Notes</a>'
    )
    expect(html).toContain('href="/media/article/example"')
    expect(html).toContain('href="#notes"')
  })
})
