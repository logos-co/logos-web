import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Stub motion/animation dependencies
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

vi.mock('@/components/ui', () => ({
  DragScroll: ({
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

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode
    href: string
    className?: string
  }) => createElement('a', { href, className }, children),
}))

import UseCasesSection from '../use-cases-section'

const card = (title: string) => ({ title, body: 'body text' })

const data = {
  componentType: 'homeUseCases' as const,
  key: 'home.useCases',
  eyebrow: 'Use Cases',
  headline: 'Privacy is the condition.',
  headlineMobile: 'Privacy.',
  thesisCta: 'Read the Logos PriFi Thesis',
  secure: card('Secure, private communications.'),
  money: card('Private, censorship-resistant money.'),
  archives: card('Permanent, decentralised archives.'),
  donations: card('Anonymous donations and mutual aid.'),
}

describe('UseCasesSection', () => {
  it('renders eyebrow, card title, and the PriFi thesis link', () => {
    const html = renderToStaticMarkup(createElement(UseCasesSection, { data }))

    // Eyebrow appears in both mobile and desktop slots
    expect(html).toContain('Use Cases')

    // A card title renders
    expect(html).toContain('Secure, private communications.')

    // The thesis line renders as a link in both the mobile and desktop slots
    expect(html.split('>Read the Logos PriFi Thesis<').length - 1).toBe(2)

    // The anchor must carry the PriFi route (apps/web/constants/routes.ts).
    expect(html).toContain('href="/prifi"')
    expect(html).not.toContain('href="/lambda-prize"')
  })
})
