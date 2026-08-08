import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import StatementHeading from '../statement-heading'

const render = (props: Parameters<typeof StatementHeading>[0]) =>
  renderToStaticMarkup(createElement(StatementHeading, props))

describe('StatementHeading', () => {
  test('renders both statement lines with the muted continuation', () => {
    const html = render({
      headline: 'Logos is not for everyone.',
      headlineMuted: 'Logos is for people who are done waiting for permission.',
    })

    expect(html).toContain('Logos is not for everyone.')
    expect(html).toContain(
      'Logos is for people who are done waiting for permission.'
    )
    // The continuation line is the only one that carries the muted colour.
    expect(html.match(/#848e88/g)).toHaveLength(1)
  })

  test('renders a single h2 so callers own their own wrapper and spacing', () => {
    const html = render({ headline: 'A', headlineMuted: 'B' })

    expect(html.startsWith('<h2')).toBe(true)
    expect(html.endsWith('</h2>')).toBe(true)
  })
})
