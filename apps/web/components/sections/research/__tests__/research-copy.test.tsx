import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ResearchCopySection } from '@repo/content/schemas'

// Stub next/image to avoid Next.js server-only dependencies
vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    createElement('img', { alt, src }),
}))

// Stub ContentWidth to avoid layout dependencies
vi.mock('@/components/layout/content-width', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement('div', { className }, children),
}))

// Stub @/components/ui to avoid @acid-info/logos-ui dependency
vi.mock('@/components/ui', () => ({
  ButtonArrowIcon: () => createElement('span', {}, '→'),
}))

// Stub @/i18n/navigation to avoid Next.js router dependency
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
    createElement('a', { href, className }, children),
}))

import { HeroSection } from '../_sections/hero-section'
import { ResourcesSection } from '../_sections/resources-section'

const sectionData: ResearchCopySection = {
  componentType: 'researchCopy',
  key: 'research.copy',
  hero: {
    kicker: 'Research and development across the Logos Network and IFT.',
    title: 'Logos\nResearch',
    description: 'Logos Research conducts innovative exploration within the Logos ecosystem and wider IFT.',
    ctas: [
      { label: 'Specs/RFCs', href: 'https://lip.logos.co/' },
      { label: 'Research Forum', href: 'https://forum.research.logos.co/' },
    ],
  },
  overview: {
    title: 'Overview',
    body: { paragraphs: { p1: 'Paragraph one.' } },
    cta: { label: 'Join the Research Forum', href: 'https://forum.research.logos.co/' },
  },
  resources: {
    title: 'Resources',
    learnMore: 'Learn more',
    items: [
      { number: '01', label: 'Specs/RFCs', href: 'https://lip.logos.co/' },
      { number: '02', label: 'Research Forum', href: 'https://forum.research.logos.co/' },
      { number: '03', label: 'Discord', href: 'https://discord.gg/PQFdubGt6d', cta: 'Join server' },
    ],
  },
  contribute: {
    title: 'Contribute',
    copy: {
      howTitle: 'How to contribute',
      contact: 'Get in touch with us by <discord></discord>, <forum></forum>, or <github></github>.',
      jobs: 'Also, see <jobs></jobs>.',
      links: { discord: 'joining our Discord', forum: 'opening a thread in our forum', github: 'opening issues / PRs on GitHub', jobs: 'IFT current job openings' },
      whatTitle: 'What to contribute',
      whatBody: 'We are interested in both research and code contributions.',
      codeIntro: 'For code contributions, see our "good first issue" lists:',
      codeLinks: [{ label: 'nim-libp2p', href: 'https://github.com/vacp2p/nim-libp2p' }],
    },
  },
}

describe('ResearchPage – hero section driven from data', () => {
  it('renders the kicker from data', () => {
    const html = renderToStaticMarkup(
      createElement(HeroSection, {
        kicker: sectionData.hero.kicker,
        title: sectionData.hero.title,
        description: sectionData.hero.description,
        ctas: sectionData.hero.ctas,
      })
    )
    expect(html).toContain('Research and development across the Logos Network and IFT.')
  })

  it('renders the title from data', () => {
    const html = renderToStaticMarkup(
      createElement(HeroSection, {
        kicker: sectionData.hero.kicker,
        title: sectionData.hero.title,
        description: sectionData.hero.description,
        ctas: sectionData.hero.ctas,
      })
    )
    expect(html).toContain('Logos')
    expect(html).toContain('Research')
    expect(html).toContain('<h1')
  })

  it('renders the description from data', () => {
    const html = renderToStaticMarkup(
      createElement(HeroSection, {
        kicker: sectionData.hero.kicker,
        title: sectionData.hero.title,
        description: sectionData.hero.description,
        ctas: sectionData.hero.ctas,
      })
    )
    expect(html).toContain('Logos Research conducts innovative exploration')
  })

  it('renders CTA labels from data', () => {
    const html = renderToStaticMarkup(
      createElement(HeroSection, {
        kicker: sectionData.hero.kicker,
        title: sectionData.hero.title,
        description: sectionData.hero.description,
        ctas: sectionData.hero.ctas,
      })
    )
    expect(html).toContain('Specs/RFCs')
    expect(html).toContain('Research Forum')
  })
})

describe('ResearchPage – resources section driven from data', () => {
  it('renders the section title from data', () => {
    const html = renderToStaticMarkup(
      createElement(ResourcesSection, {
        title: sectionData.resources.title,
        learnMoreLabel: sectionData.resources.learnMore,
        items: sectionData.resources.items,
      })
    )
    expect(html).toContain('Resources')
    expect(html).toContain('<h2')
  })

  it('renders resource item labels from data', () => {
    const html = renderToStaticMarkup(
      createElement(ResourcesSection, {
        title: sectionData.resources.title,
        learnMoreLabel: sectionData.resources.learnMore,
        items: sectionData.resources.items,
      })
    )
    expect(html).toContain('Specs/RFCs')
    expect(html).toContain('Research Forum')
    expect(html).toContain('Discord')
  })

  it('renders per-item CTA override from data', () => {
    const html = renderToStaticMarkup(
      createElement(ResourcesSection, {
        title: sectionData.resources.title,
        learnMoreLabel: sectionData.resources.learnMore,
        items: sectionData.resources.items,
      })
    )
    expect(html).toContain('Join server')
  })

  it('falls back to learnMore label when item has no cta', () => {
    const html = renderToStaticMarkup(
      createElement(ResourcesSection, {
        title: sectionData.resources.title,
        learnMoreLabel: sectionData.resources.learnMore,
        items: sectionData.resources.items,
      })
    )
    expect(html).toContain('Learn more')
  })
})
