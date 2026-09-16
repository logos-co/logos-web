import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import { prifiCopySectionSchema } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import prifiPage from '../../../../../../content/pages/en/prifi.json' with { type: 'json' }

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

import PriFiPage, { generateMetadata } from '../page'

const COPY = prifiCopySectionSchema.parse(prifiPage.sections[0])
const {
  credibility: CREDIBILITY,
  deeperDives: DEEPER_DIVES,
  exploitBand: EXPLOIT_BAND,
  hazards: HAZARDS,
  hero: HERO,
  institutions: INSTITUTIONS,
  logosStack: LOGOS_STACK,
  protection: PROTECTION,
  supplyChain: SUPPLY_CHAIN,
  transparency: TRANSPARENCY,
} = COPY

/** React escapes special text characters, so expectations have to as well. */
const asMarkup = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/>/g, '&gt;')

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

  test('metadata carries the page title, description and canonical URL', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    })

    expect(String(metadata.alternates?.canonical)).toMatch(/\/prifi$/)
    expect(metadata.title).toBe(prifiPage.title)
    expect(metadata.description).toBe(prifiPage.description)
    // Social cards repeat them rather than falling back to the site defaults.
    expect(metadata.openGraph?.title).toBe(prifiPage.title)
    expect(metadata.twitter?.description).toBe(prifiPage.description)
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

    expect(HERO.secondaryCta.href).toBe('#transaction-supply-chain')
    expect(html).toContain('id="transaction-supply-chain"')
    expect(html).toContain('href="#transaction-supply-chain"')
  })

  test('includes the source copy on increased risk and transaction costs', () => {
    expect(SUPPLY_CHAIN.lead).toContain(
      'Increased risk means increased transaction costs.'
    )
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

  test('every deeper-dive card links out with its CTA, once it has a URL', async () => {
    const html = await pageHtml()

    for (const card of DEEPER_DIVES.cards) {
      if (card.href) expect(html).toContain(`href="${card.href}"`)
    }
    expect(html.split(DEEPER_DIVES.cards[0].cta).length - 1).toBe(
      DEEPER_DIVES.cards.length
    )
  })

  test('links the hero and Theory CTAs to the published PriFi article', async () => {
    const html = await pageHtml()
    const articleUrl =
      'https://blog.logos.co/article/pri-fi-securing-transaction-supply-chain'

    expect(HERO.primaryCta.href).toBe(articleUrl)
    expect(DEEPER_DIVES.cards[0].href).toBe(articleUrl)
    expect(html.split(`href="${articleUrl}"`).length - 1).toBe(2)
    expect(DEEPER_DIVES.cards.map((card) => card.title)).toEqual(['Theory'])
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

  test('mounts only the active supply chain diagram initially', async () => {
    const html = await pageHtml()
    const mountedDiagrams = SUPPLY_CHAIN.links.filter((link) =>
      html.includes(`alt="${asMarkup(link.graph.alt)}"`)
    )

    expect(mountedDiagrams).toEqual([SUPPLY_CHAIN.links[0]])
  })

  test('below 1024px lists every supply chain link as a closed accordion row', async () => {
    const html = await pageHtml()
    const start = html.indexOf('data-chain-layout="accordion"')
    const end = html.indexOf('data-chain-layout="tabs"')
    expect(start, 'accordion layout missing').toBeGreaterThan(-1)
    expect(end, 'tabs layout missing').toBeGreaterThan(start)

    const accordion = html.slice(start, end)
    const toggles: string[] =
      accordion.match(/<button[^>]*aria-expanded="[^"]*"[^>]*>/g) ?? []

    // Every link is listed, and all start closed so the whole chain is visible.
    expect(toggles).toHaveLength(SUPPLY_CHAIN.links.length)
    expect(
      toggles.every((toggle) => toggle.includes('aria-expanded="false"'))
    ).toBe(true)
    for (const link of SUPPLY_CHAIN.links) {
      expect(accordion).toContain(asMarkup(link.label))
    }

    // Each layout shows on its own side of the lg breakpoint.
    expect(html.slice(Math.max(0, start - 200), start + 120)).toMatch(
      /class="[^"]*\blg:hidden\b/
    )
    expect(html.slice(Math.max(0, end - 200), end + 120)).toMatch(
      /class="[^"]*\bhidden lg:block\b/
    )
  })

  test('gives every supply chain link its facts, two costs and a diagram', () => {
    const diagramSources = new Set(
      SUPPLY_CHAIN.links.map((link) => link.graph.src)
    )

    expect(diagramSources.size).toBe(SUPPLY_CHAIN.links.length)
    for (const link of SUPPLY_CHAIN.links) {
      expect(link.exposes && link.tools && link.threat, link.label).toBeTruthy()
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
