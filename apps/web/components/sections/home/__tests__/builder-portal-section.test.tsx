import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Stub heavy/animation imports to avoid browser-only deps in SSR tests
vi.mock('@/components/motion/section-heading-reveal', () => ({
  SectionHeadingReveal: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

vi.mock('@/components/ui', () => ({
  Button: ({
    children,
    href,
    className,
  }: {
    children: ReactNode
    href?: string
    className?: string
  }) => createElement('a', { href, className }, children),
  ButtonArrowIcon: () => createElement('span', null, '→'),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement('img', { src, alt }),
}))

vi.mock('@/components/layout/content-width', () => ({
  default: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

import BuilderPortalSection from '../builder-portal-section'

const data = {
  componentType: 'homeBuilderPortal' as const,
  key: 'home.builderPortal',
  title: 'Basecamp.',
  description: 'Build something real.',
  cta: 'Learn more',
  featureChat: 'Load a basic chat app',
  featureNode: 'Run a node',
  featureTransactions: 'Execute private transactions',
}

describe('BuilderPortalSection', () => {
  it('renders title, CTA, and description from data props', () => {
    const html = renderToStaticMarkup(createElement(BuilderPortalSection, { data }))
    expect(html).toContain('Basecamp.')
    expect(html).toContain('Learn more')
    expect(html).toContain('Build something real.')
  })
})
