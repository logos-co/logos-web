import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Mock the navigation module to avoid Next.js router dependency in Node tests
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    createElement('a', { href, ...props }, children),
}))

// Mock next/image to avoid Next.js image optimization in Node tests
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    className?: string
  }) => createElement('img', { src, alt, className }),
}))

// Mock logos-ui to avoid ESM/browser-only module issues
vi.mock('@acid-info/logos-ui', () => ({
  LogosMark: ({ size }: { size?: number }) =>
    createElement('span', { 'data-logos-mark': true, 'data-size': size }),
  ButtonArrowIcon: () => createElement('span', { 'data-arrow-icon': true }),
}))

// Mock motion components to avoid animation dependencies
vi.mock('@/components/motion/section-heading-reveal', () => ({
  SectionHeadingReveal: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

import FeatureCardsSection from '../feature-cards-section'

const path = { title: 'Build', body: 'b', cta: 'Start Building' }
const data = {
  componentType: 'homeChoosePath' as const,
  key: 'home.paths',
  title: 'Choose your path',
  kicker: 'k',
  body: 'Take action.',
  build: path,
  operate: { title: 'Operate', body: 'b', cta: 'Run a Node' },
  activism: { title: 'Organise', body: 'b', cta: 'Join the Movement' },
}

describe('FeatureCardsSection', () => {
  it('renders path titles and CTAs from data props', () => {
    const html = renderToStaticMarkup(
      createElement(FeatureCardsSection, { data })
    )
    expect(html).toContain('Choose your path')
    expect(html).toContain('Run a Node')
    expect(html).toContain('Join the Movement')
  })

  it('renders stable analytics names on the path links', () => {
    const html = renderToStaticMarkup(
      createElement(FeatureCardsSection, {
        data,
        eventNames: {
          build: 'Start Building',
          operate: 'Run a Node',
          activism: 'Join the Movement',
        },
      })
    )

    expect(html).toContain('data-umami-event-name="Start Building"')
    expect(html).toContain('data-umami-event-name="Run a Node"')
    expect(html).toContain('data-umami-event-name="Join the Movement"')
  })
})
