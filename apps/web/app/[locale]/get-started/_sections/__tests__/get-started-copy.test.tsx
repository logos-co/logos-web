import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { GetStartedCopySection } from '@repo/content/schemas'

// Stub heavy imports to avoid browser-only / server-only dependencies
vi.mock('@acid-info/logos-ui', () => ({
  LogosMark: () => createElement('span', null, 'LogosMark'),
}))

vi.mock('@/components/layout/content-width', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    createElement('div', { className }, children),
}))

vi.mock('@/components/sections/shared/basecamp-install-section', () => ({
  BasecampInstallSection: ({
    title,
    index,
  }: {
    title: string
    index: string
    id?: string
    cards?: unknown[]
  }) => createElement('div', null, index, title),
}))

vi.mock('@/components/sections/shared/start-building-card-grid', () => ({
  StartBuildingCardGrid: ({ cards }: { cards: { title: string }[] }) =>
    createElement(
      'ul',
      null,
      ...cards.map((c, i) => createElement('li', { key: i }, c.title))
    ),
}))

vi.mock('@/components/sections/shared/developer-programs-section', () => ({
  DeveloperProgramsSection: () => createElement('div', null, 'Programs'),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: ReactNode }) =>
    createElement('span', null, children),
  ButtonArrowIcon: () => createElement('span', null, '→'),
}))

import { GetStartedPage } from '../get-started-page'

const sectionData: GetStartedCopySection = {
  componentType: 'getStartedCopy',
  key: 'getStarted.copy',
  heading: 'Get Started',
  intro: 'Everything you need to start building privacy-first, decentralised applications.',
  sections: {
    install: {
      number: '01',
      heading: 'Install Basecamp',
      cardTitle: 'Install Logos Basecamp',
      body: 'Basecamp is the development environment for Logos.',
      cta: 'Install Basecamp',
      imageAlt: 'Logos Basecamp application interface',
    },
    docs: {
      number: '02',
      heading: 'Start Building',
      items: {
        docs: { title: 'Read the docs', body: 'Deep dive into the Logos stack.' },
        scaffold: { title: 'Start with the Scaffold Boilerplate', body: 'A Rust CLI.' },
        sampleApps: { title: 'Sample Apps', body: 'Run real sample apps.' },
        workshops: { title: 'Workshops and Tutorials', body: 'Live coding sessions.' },
      },
      viewDocsCta: 'View the docs',
      learnMoreCta: 'Learn more',
      atomicSwapsCta: 'Atomic swaps',
      multisigCta: 'Multisig',
    },
    community: {
      number: '04',
      heading: 'Join the community',
      cta: 'Learn more',
      items: {
        forum: 'Community Forum',
        research: 'Research Forum',
        discord: 'Discord',
        xLogosNetwork: 'X Logos_network',
        xLogosDevs: 'X Logos_devs',
        youtubeTutorials: 'YouTube Tutorials',
      },
    },
    build: {
      number: '04',
      heading: 'What you can build today',
      cta: 'Run app',
      nodeCta: 'Run a node',
      messagingCta: 'Messaging SDK',
      deployCta: 'Deploy',
      tryItOutCta: 'Try it out',
      scaffoldCta: 'Run scaffold',
      items: {
        node: { title: 'Run a node', body: 'Participate in the testnet.' },
        messaging: { title: 'Build with Logos Messaging SDK', body: 'Add private messaging.' },
        lez: { title: 'Deploy to the LEZ', body: 'The Logos Execution Zone.' },
        storage: { title: 'Store files on Logos Storage', body: 'Use decentralised storage.' },
        atomicSwaps: { title: 'Run Atomic Swaps Demo App', body: '' },
        zkMultiSig: { title: 'Run ZK Multi-Sig Demo App', body: '' },
        scaffold: { title: 'Logos Scaffold', body: '' },
      },
    },
  },
}

const basecampInstall = {
  cards: [],
}

const developerPrograms = {
  title: 'Programs',
  items: [],
}

describe('GetStartedPage – content-driven copy', () => {
  it('renders heading from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(GetStartedPage, {
        data: sectionData,
        basecampInstall: basecampInstall as never,
        developerPrograms: developerPrograms as never,
        rfps: [],
      })
    )
    expect(html).toContain('Get Started')
  })

  it('renders intro from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(GetStartedPage, {
        data: sectionData,
        basecampInstall: basecampInstall as never,
        developerPrograms: developerPrograms as never,
        rfps: [],
      })
    )
    expect(html).toContain('Everything you need to start building privacy-first')
  })

  it('renders docs heading "Start Building" from data', () => {
    const html = renderToStaticMarkup(
      createElement(GetStartedPage, {
        data: sectionData,
        basecampInstall: basecampInstall as never,
        developerPrograms: developerPrograms as never,
        rfps: [],
      })
    )
    expect(html).toContain('Start Building')
  })

  it('renders community heading from data', () => {
    const html = renderToStaticMarkup(
      createElement(GetStartedPage, {
        data: sectionData,
        basecampInstall: basecampInstall as never,
        developerPrograms: developerPrograms as never,
        rfps: [],
      })
    )
    expect(html).toContain('Join the community')
  })
})
