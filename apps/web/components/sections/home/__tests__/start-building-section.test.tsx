import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Stub Button/ButtonArrowIcon to avoid UI library dependencies
vi.mock('@/components/ui', () => ({
  Button: ({
    children,
    href,
  }: {
    children: ReactNode
    href?: string
  }) => createElement('a', { href }, children),
  ButtonArrowIcon: () => createElement('span', null, '→'),
}))

// Stub ContentWidth to avoid layout dependencies
vi.mock('@/components/layout/content-width', () => ({
  default: ({ children }: { children: ReactNode }) =>
    createElement('div', null, children),
}))

// Stub next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement('img', { src, alt }),
}))

import StartBuildingSection from '../start-building-section'

const data = {
  componentType: 'homeStartBuilding' as const,
  key: 'home.startBuilding',
  title: 'Start building.',
  body: 'b',
  cta: 'Get Started',
  cardCta: 'Learn more',
  lambdaPrize: 'Lambda Prize',
  rfps: 'RFPs',
  ideas: 'Starter Issues and Community Ideas Repo',
  docs: 'View the Documentation',
}

describe('StartBuildingSection', () => {
  it('renders title, CTA, and card labels from data props', () => {
    const html = renderToStaticMarkup(
      createElement(StartBuildingSection, { data })
    )
    expect(html).toContain('Start building.')
    expect(html).toContain('Get Started')
    expect(html).toContain('Lambda Prize')
  })
})
