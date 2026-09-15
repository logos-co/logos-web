import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Stub StackCard to avoid animation/browser-only dependencies
vi.mock('@/components/motion/stack-card', () => ({
  StackCard: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: ReactNode
    href: string
    className?: string
  }) => createElement('a', { href, className }, children),
}))

import { ROUTES } from '@/constants/routes'

import PrifiSection from '../prifi-section'

const data = {
  componentType: 'homePrifi' as const,
  key: 'home.prifi',
  headline:
    'A parallel society needs an economy. \nPriFi protects its participants.',
  bodyParts: ['First paragraph.', 'Second paragraph.'],
  cta: 'Read the PriFi Thesis',
}

describe('PrifiSection', () => {
  it('renders the headline, both paragraphs and the link to the PriFi page', () => {
    const html = renderToStaticMarkup(createElement(PrifiSection, { data }))

    expect(html).toContain('PriFi protects its participants.')
    expect(html).toContain('First paragraph.')
    expect(html).toContain('Second paragraph.')
    expect(html).toContain(data.cta)
    expect(html).toContain(`href="${ROUTES.prifi}"`)
  })
})
