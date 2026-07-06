import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Mock the navigation module to avoid Next.js router dependency in Node tests
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}))

import SocialProofSection from '../social-proof-section'

const data = {
  componentType: 'homeSocialProof' as const,
  key: 'home.socialProof',
  headline1: 'Logos is not for everyone.',
  headline2: 'Logos is for people who are done waiting for permission.',
  manifestoCta: 'Read the manifesto',
  contributions: {
    label: 'Contributors',
    body: 'An open source community of builders, researchers, and technologists.',
  },
  nodeOperators: {
    label: 'Node Operators',
    body: 'A decentralised network of independent Node operators ensuring Logos is secure.',
  },
  circles: {
    label: 'Circles',
    body: 'Local chapters of activists and change seekers solving real world issues.',
  },
  winnableIssues: {
    label: 'Winnable Issues',
    body: 'Local issues that Circles identify and solve – from privacy tech to community funding.',
  },
}

const stats = {
  contributions: '3,441',
  contributors: '218',
  repositories: '341',
}

describe('SocialProofSection', () => {
  it('renders headlines and CTA from data props', () => {
    const html = renderToStaticMarkup(
      createElement(SocialProofSection, {
        data,
        stats,
        winnableIssuesCount: '1',
      })
    )
    expect(html).toContain('Logos is not for everyone.')
    expect(html).toContain('Read the manifesto')
    expect(html).toContain('Contributors')
  })
})
