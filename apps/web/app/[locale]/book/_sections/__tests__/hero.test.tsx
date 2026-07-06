import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Stub next/image to avoid Next.js server-only dependencies
vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    createElement('img', { alt, src }),
}))

// Stub ActionGroup to avoid icon/constant dependencies
vi.mock('../atoms', () => ({
  ActionGroup: ({ className }: { className?: string }) =>
    createElement('div', { className }, 'actions'),
}))

import { Hero } from '../hero'

describe('Hero – heading driven from data', () => {
  it('renders the heading prop in the h1', () => {
    const html = renderToStaticMarkup(
      createElement(Hero, { heading: 'Farewell to Westphalia' })
    )
    expect(html).toContain('Farewell to Westphalia')
    expect(html).toContain('<h1')
  })

  it('renders an arbitrary heading value', () => {
    const html = renderToStaticMarkup(
      createElement(Hero, { heading: 'Custom Heading' })
    )
    expect(html).toContain('Custom Heading')
  })
})
