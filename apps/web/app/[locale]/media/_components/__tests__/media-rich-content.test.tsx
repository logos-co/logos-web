import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MediaRichContent } from '../media-rich-content'

describe('MediaRichContent', () => {
  it('renders rich text and escaped code in CMS order', () => {
    const html = renderToStaticMarkup(
      <MediaRichContent
        blocks={[
          { type: 'rich-text', body: '<p>Opening paragraph</p>' },
          {
            type: 'code-block',
            code: '<script>example()</script>',
            language: 'html',
          },
          { type: 'rich-text', body: '<p>Closing paragraph</p>' },
        ]}
      />
    )
    expect(html.indexOf('Opening paragraph')).toBeLessThan(
      html.indexOf('<code')
    )
    expect(html.indexOf('</code>')).toBeLessThan(
      html.indexOf('Closing paragraph')
    )
    expect(html).toContain('&lt;script&gt;example()&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('preserves the legacy body precedence when both sources exist', () => {
    const html = renderToStaticMarkup(
      <MediaRichContent
        bodyHtml="<p>Existing article</p>"
        blocks={[{ type: 'rich-text', body: '<p>Alternative blocks</p>' }]}
      />
    )
    expect(html).toContain('Existing article')
    expect(html).not.toContain('Alternative blocks')
  })

  it('renders the legacy parsed content when no body or blocks exist', () => {
    const html = renderToStaticMarkup(
      <MediaRichContent
        content={[
          {
            type: 'text',
            order: 1,
            tagName: 'p',
            html: '<p>Parsed article</p>',
            text: 'Parsed article',
            labels: [],
          },
        ]}
      />
    )
    expect(html).toContain('Parsed article')
  })
})
