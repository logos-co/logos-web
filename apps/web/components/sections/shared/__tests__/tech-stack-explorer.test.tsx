import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pageState = vi.hoisted(() => ({
  page: {
    sections: [] as Array<Record<string, unknown>>,
  },
}))

const createOverviewSection = (
  overrides: Readonly<Record<string, unknown>> = {}
) => ({
  componentType: 'techStackOverview',
  key: 'techStack.overview',
  title: 'The Logos Technology Stack.',
  pillars: [],
  networkingTitle: 'Networking',
  foundationTitle: 'Runtime',
  ...overrides,
})

vi.mock('@repo/content/loaders', () => ({
  getPageCopy: vi.fn(async () => pageState.page),
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

vi.mock('@/components/motion/reveal', () => ({
  Reveal: ({ children, className }: { children: ReactNode; className?: string }) =>
    createElement('div', { className }, children),
  RevealItem: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement('div', { className }, children),
}))

vi.mock('../tech-stack-diagram', () => ({
  TechStackDiagram: () => createElement('div', { 'data-testid': 'diagram' }),
}))

import TechStackExplorer from '../tech-stack-explorer'

describe('TechStackExplorer', () => {
  beforeEach(() => {
    pageState.page = {
      sections: [createOverviewSection()],
    }
  })

  it('fails loudly when explorer copy is missing', async () => {
    await expect(
      TechStackExplorer({ locale: 'en' })
    ).rejects.toThrow(
      'technology-stack techStackOverview.explorer copy is required'
    )
  })

  it('renders explorer copy from content', async () => {
    pageState.page.sections[0] = createOverviewSection({
      explorer: {
        titleLine1: 'Explore the Logos',
        titleLine2: 'Technology Stack.',
        body: 'A modular ecosystem of distinct modules.',
      },
    })

    const element = await TechStackExplorer({ locale: 'en' })
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Explore the Logos')
    expect(html).toContain('Technology Stack.')
    expect(html).toContain('A modular ecosystem of distinct modules.')
  })
})
