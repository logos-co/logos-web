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

import DecideSection from '../decide-section'

const data = {
  componentType: 'homeDecide' as const,
  key: 'home.decide',
  headline: 'We get to decide what comes next.',
  headline2: 'Remain in the decline.',
  headline3: 'Or exit and build the alternative.',
  bodyParts: ['p1', 'p2', 'p3', 'p4'],
}

describe('DecideSection', () => {
  it('renders headlines and body parts from data props', () => {
    const html = renderToStaticMarkup(createElement(DecideSection, { data }))
    expect(html).toContain('We get to decide what comes next.')
    expect(html).toContain('p4')
  })
})
