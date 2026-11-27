import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const { FieldGuideContent } = await import('../field-guide-content')

describe('FieldGuideContent', () => {
  it('keeps the raw HTML the chapters use', () => {
    const html = renderToStaticMarkup(
      <FieldGuideContent body="Press <kbd>Ctrl</kbd> and <strong>hold</strong>." />
    )
    expect(html).toContain('<kbd>Ctrl</kbd>')
    expect(html).toContain('<strong>hold</strong>')
  })

  it('drops scripts, event handlers and javascript: links', () => {
    const html = renderToStaticMarkup(
      <FieldGuideContent
        body={[
          '<script>alert(1)</script>',
          '<img src="x.png" onerror="alert(1)">',
          '<a href="javascript:alert(1)">bad</a>',
        ].join('\n\n')}
      />
    )
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('javascript:')
  })
})
