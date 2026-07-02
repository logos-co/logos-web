import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Stub motion/animation dependencies to avoid browser-only APIs
vi.mock('@/components/motion/section-heading-reveal', () => ({
  SectionHeadingReveal: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

vi.mock('@/components/motion/stack-card', () => ({
  StackCard: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement('img', { src, alt }),
}))

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({
      children,
      className,
    }: {
      children: ReactNode
      className?: string
    }) => createElement('div', { className }, children),
  },
}))

import AboutSection from '../about-section'

const problem = (title: string, facts: string[]) => ({
  title,
  subtitle: `${title} subtitle`,
  body: `${title} body`,
  facts,
})

const data = {
  componentType: 'homeAbout' as const,
  key: 'home.about',
  heading: 'Civil society is in decline.',
  headingMobile: 'Civil society is in decline on mobile.',
  problems: {
    debt: {
      ...problem('Debt', [
        'debt fact alpha',
        'debt fact beta',
        'debt fact gamma',
        'debt fact delta',
      ]),
      factLinks: [
        {
          index: 1,
          label: 'debt fact beta',
          href: 'https://example.com/debt-fact',
        },
      ],
    },
    surveillance: problem('Surveillance', [
      'surveillance fact alpha',
      'surveillance fact beta',
      'surveillance fact gamma',
    ]),
    corruption: problem('Corruption', [
      'corruption fact alpha',
      'corruption fact beta',
      'corruption fact gamma',
    ]),
    stagnation: problem('Stagnation', [
      'stagnation fact alpha',
      'stagnation fact beta',
    ]),
  },
}

describe('AboutSection', () => {
  it('renders heading from data props', () => {
    const html = renderToStaticMarkup(createElement(AboutSection, { data }))
    expect(html).toContain('Civil society is in decline.')
    expect(html).toContain('Civil society is in decline on mobile.')
  })

  it('renders problem titles from data props', () => {
    const html = renderToStaticMarkup(createElement(AboutSection, { data }))
    expect(html).toContain('Debt')
    expect(html).toContain('Surveillance')
    expect(html).toContain('Corruption')
    expect(html).toContain('Stagnation')
  })

  it('renders per-problem facts from data props', () => {
    const html = renderToStaticMarkup(createElement(AboutSection, { data }))
    // The accordion opens the first problem (debt) by default, so its facts
    // surface in the rendered markup in their content array order.
    expect(html).toContain('debt fact alpha')
    expect(html).toContain('debt fact beta')
    expect(html).toContain('debt fact gamma')
    expect(html).toContain('debt fact delta')
    // Facts are rendered in the order they appear in the content array.
    expect(html.indexOf('debt fact alpha')).toBeLessThan(
      html.indexOf('debt fact beta')
    )
    expect(html.indexOf('debt fact beta')).toBeLessThan(
      html.indexOf('debt fact gamma')
    )
    expect(html.indexOf('debt fact gamma')).toBeLessThan(
      html.indexOf('debt fact delta')
    )
  })

  it('renders fact links from data props', () => {
    const html = renderToStaticMarkup(createElement(AboutSection, { data }))
    expect(html).toContain('href="https://example.com/debt-fact"')
    expect(html).toContain('debt fact beta')
  })
})
