import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: ReactNode
    href: string
    className?: string
  }) =>
    createElement('a', { href, className, 'data-intl-link': true }, children),
}))

import {
  CREDIBILITY,
  DEEPER_DIVES,
  EXPLOIT_BAND,
  HAZARDS,
  HERO,
  INSTITUTIONS,
  LINKS,
  LOGOS_STACK,
  PROTECTION,
  SUPPLY_CHAIN,
  SUPPLY_CHAIN_ID,
  TRANSPARENCY,
} from '../_content'
import PriFiPage, { generateMetadata } from '../page'

/** React escapes `&` and `'` in text nodes, so expectations have to as well. */
const asMarkup = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/'/g, '&#x27;')

/** Collapses the hand-set `\n` breaks the way the rendered text reads. */
const oneLine = (text: string): string => text.replace(/\s*\n\s*/g, ' ').trim()

const pageHtml = async () => {
  const element = await PriFiPage({
    params: Promise.resolve({ locale: 'en' }),
  })
  return renderToStaticMarkup(element)
}

const publicFile = (src: string) => join(process.cwd(), 'public', src)

describe('prifi page contract', () => {
  test('is registered on the canonical route', () => {
    expect(ROUTES.prifi).toBe('/prifi')
  })

  test('metadata points the canonical URL at /prifi', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    })

    expect(String(metadata.alternates?.canonical)).toMatch(/\/prifi$/)
  })

  test('every image the page ships exists under public/', async () => {
    const html = await pageHtml()
    const sources = [
      ...new Set(
        [...html.matchAll(/(?:src|srcSet)="([^"]+)"/g)].flatMap((match) =>
          match[1]!.split(',').map((entry) => entry.trim().split(' ')[0]!)
        )
      ),
    ]
      .map((src) =>
        decodeURIComponent(src.replace(/^.*[?&]url=([^&]+).*$/, '$1'))
      )
      .filter((src) => src.startsWith('/images/'))

    expect(sources.length).toBeGreaterThan(0)
    for (const src of sources) {
      expect(existsSync(publicFile(src)), src).toBe(true)
    }
    for (const card of CREDIBILITY) {
      expect(existsSync(publicFile(card.image)), card.image).toBe(true)
    }
  })
})

describe('prifi page render', () => {
  test('renders every section heading, in Figma order', async () => {
    const html = await pageHtml()
    const headings = [
      HERO.heading[0],
      oneLine(SUPPLY_CHAIN.heading),
      EXPLOIT_BAND.conclusion,
      oneLine(HAZARDS.heading),
      oneLine(PROTECTION.heading),
      TRANSPARENCY.heading,
      CREDIBILITY[0].title,
      LOGOS_STACK.heading,
      INSTITUTIONS.heading,
      DEEPER_DIVES.heading,
    ]

    const text = html.replace(/<br\s*\/?>/g, ' ').replace(/\s+/g, ' ')
    let cursor = -1
    for (const heading of headings) {
      const at = text.indexOf(asMarkup(heading).replace(/\s+/g, ' '))
      expect(at, `missing heading "${heading}"`).toBeGreaterThan(-1)
      expect(at, `heading "${heading}" is out of order`).toBeGreaterThan(cursor)
      cursor = at
    }
  })

  test('uses a single h1 for the hero statement', async () => {
    const html = await pageHtml()
    expect(html.match(/<h1\b/g)).toHaveLength(1)
  })

  test('the supply chain CTA scrolls to the supply chain section', async () => {
    const html = await pageHtml()

    expect(LINKS.supplyChain).toBe(`#${SUPPLY_CHAIN_ID}`)
    expect(html).toContain(`id="${SUPPLY_CHAIN_ID}"`)
    expect(html).toContain(`href="#${SUPPLY_CHAIN_ID}"`)
  })

  test('renders both comparison tables as real tables', async () => {
    const html = await pageHtml()
    const tables = html.match(/<table\b/g) ?? []

    expect(tables).toHaveLength(2)
    for (const row of LOGOS_STACK.rows) {
      expect(html).toContain(row.covers)
    }
    for (const column of PROTECTION.matrix.columns) {
      expect(html).toContain(column)
    }
  })

  test('every deeper-dive card links out with its CTA', async () => {
    const html = await pageHtml()

    for (const card of DEEPER_DIVES.cards) {
      expect(html).toContain(`href="${card.href}"`)
    }
    expect(html.split(DEEPER_DIVES.cards[0].cta).length - 1).toBe(
      DEEPER_DIVES.cards.length
    )
  })

  test('gives every table column and row a header', async () => {
    const html = await pageHtml()

    expect(html.match(/<th scope="col"/g)).toHaveLength(
      PROTECTION.matrix.columns.length + LOGOS_STACK.columns.length
    )
    expect(html.match(/<th scope="row"/g)).toHaveLength(
      PROTECTION.matrix.rows.length + LOGOS_STACK.rows.length
    )
  })

  test('nests each credibility card under the transparency heading', async () => {
    const html = await pageHtml()
    const lastCard = `${CREDIBILITY[CREDIBILITY.length - 1]!.title}</h3>`
    const section = html.slice(
      html.indexOf(TRANSPARENCY.heading),
      html.indexOf(lastCard) + lastCard.length
    )

    // No section boundary between the h2 and the cards it introduces.
    expect(section).not.toContain('</section>')
    for (const card of CREDIBILITY) {
      expect(section).toContain(`${card.title}</h3>`)
    }
  })

  test('renders the seven supply chain links as tabs, Discovery first', async () => {
    const html = await pageHtml()
    const tabs = html.match(/<button[^>]*role="tab"[^>]*>/g) ?? []

    expect(tabs).toHaveLength(SUPPLY_CHAIN.links.length)
    expect(tabs[0]).toContain('aria-selected="true"')
    expect(
      tabs.slice(1).every((tab) => tab.includes('aria-selected="false"'))
    ).toBe(true)
    expect(html).toContain('role="tabpanel"')
    for (const link of SUPPLY_CHAIN.links) {
      expect(html).toContain(asMarkup(link.label))
    }
    // The panel starts on Discovery's facts.
    expect(html).toContain(asMarkup(SUPPLY_CHAIN.links[0].exposes))
  })

  test('gives every supply chain link its facts, two costs and a diagram', () => {
    for (const link of SUPPLY_CHAIN.links) {
      expect(
        link.exposes && link.tools && link.threat && link.outro,
        link.label
      ).toBeTruthy()
      expect(link.stats, link.label).toHaveLength(
        SUPPLY_CHAIN.statLabels.length
      )
      expect(existsSync(publicFile(link.graph.src)), link.graph.src).toBe(true)
      expect(link.graph.alt.length, link.label).toBeGreaterThan(0)
    }
  })

  test('marks the dark top of the page so the header keeps light ink over it', async () => {
    const html = await pageHtml()
    expect(html.match(/data-header-tone="dark"/g)).toHaveLength(1)
  })
})
