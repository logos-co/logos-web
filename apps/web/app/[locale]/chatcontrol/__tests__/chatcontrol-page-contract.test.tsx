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
  }) => createElement('a', { href, className, 'data-intl-link': true }, children),
}))

import {
  CASE_FILE,
  CHART,
  DOES_NOT_CATCH,
  HERO,
  PROMISE,
  RIGHT_QUESTION,
  SEO,
  WE_ALL_PAY,
  WHAT_IT_TAKES,
} from '../_content'
import ChatControlPage, { generateMetadata } from '../page'
import {
  createCampaignArticleJsonLd,
  createCampaignBreadcrumbJsonLd,
} from '../_structured-data'
import {
  TYPEWRITER_ARMED_CLASS,
  HeroHeadline,
  TypewriterArmingScript,
  TypewriterQuote,
} from '../_sections/typewriter'

/** React escapes `&` in text nodes, so expectations have to escape it too. */
const asMarkup = (text: string): string => text.replace(/&/g, '&amp;')

/** Pulls the text of one of a typewriter's two visual copies. */
const copyText = (
  html: string,
  which: 'reserved' | 'typed' | 'untyped'
): string => {
  const at = html.indexOf(`data-typewriter="${which}"`)
  if (at === -1) throw new Error(`no ${which} copy rendered`)
  const open = html.indexOf('>', at) + 1
  return html.slice(open).replace(/<[^>]*>/g, '')
}

/**
 * The page is an async server component, which `renderToStaticMarkup` cannot
 * drive directly — call it and render the element it resolves to.
 */
const pageHtml = async () => {
  const element = await ChatControlPage({
    params: Promise.resolve({ locale: 'en' }),
  })
  return renderToStaticMarkup(element)
}

describe('chatcontrol page contract', () => {
  test('is registered on the canonical route', () => {
    expect(ROUTES.chatControl).toBe('/chatcontrol')
  })

  test('every case-file source has a numbered index and an https link', () => {
    expect(CASE_FILE.sources.map((source) => source.index)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
    ])
    for (const source of CASE_FILE.sources) {
      expect(source.href.startsWith('https://'), source.href).toBe(true)
    }
  })

  test('chart bars keep the proportions measured in Figma', () => {
    const [meant, actual] = CHART.groups
    expect(meant!.rows).toHaveLength(1)
    // The hatched track stands for demand that left; it has nothing to fill.
    expect(meant!.rows[0]!.fill).toBeNull()

    const fills = actual!.rows.map((row) => row.fill!)
    expect(fills[0]).toBeCloseTo(550 / 621, 5)
    expect(fills[1]).toBeCloseTo(349 / 621, 5)
    for (const fill of fills) {
      expect(fill).toBeGreaterThan(0)
      expect(fill).toBeLessThanOrEqual(1)
    }
  })
})

describe('chatcontrol page render', () => {
  test('renders every section with its heading, in Figma order', async () => {
    const html = await pageHtml()
    // Read off the copy rather than repeated here, so an editorial change to a
    // heading does not read as a broken page.
    const headings = [
      PROMISE.heading,
      DOES_NOT_CATCH.heading,
      WE_ALL_PAY.heading,
      RIGHT_QUESTION.heading,
      WHAT_IT_TAKES.heading,
      CASE_FILE.heading,
    ]

    let cursor = -1
    for (const heading of headings) {
      const at = html.indexOf(heading)
      expect(at, `missing heading "${heading}"`).toBeGreaterThan(-1)
      expect(at, `heading "${heading}" is out of order`).toBeGreaterThan(cursor)
      cursor = at
    }
  })

  test('renders every exhibit quote and case-file source', async () => {
    const html = await pageHtml()

    for (const exhibit of [
      DOES_NOT_CATCH.exhibit01,
      DOES_NOT_CATCH.exhibit02,
      WE_ALL_PAY.exhibit03,
      RIGHT_QUESTION.exhibit04,
    ]) {
      // The card quotes its source; the credit lines below it name it.
      expect(html).toContain(asMarkup(exhibit.lines[0]!))
    }
    for (const source of CASE_FILE.sources) {
      expect(html).toContain(source.href)
    }
  })

  test('case-file sources open safely in a new tab', async () => {
    const html = await pageHtml()
    // Every external anchor on the page carries the hardened rel/target pair.
    const externalAnchors = html.match(/<a [^>]*href="https:\/\/[^>]*>/g) ?? []
    expect(externalAnchors.length).toBe(CASE_FILE.sources.length)
    for (const anchor of externalAnchors) {
      expect(anchor).toContain('target="_blank"')
      expect(anchor).toContain('rel="noopener noreferrer"')
    }
  })
})

describe('typewriter', () => {
  const HEADLINE = {
    line1: HERO.headlineLine1,
    line2: HERO.headlineLine2,
  }

  test('the hero headline renders outright when animation is off', () => {
    const html = renderToStaticMarkup(
      createElement(HeroHeadline, { ...HEADLINE, animate: false })
    )

    expect(html).toContain(HERO.headlineLine1)
    expect(html).toContain(HERO.headlineLine2)
    // No overlaid or duplicated copies when the effect is off — the headline
    // is in the document exactly once. (The decorative highlight is still
    // aria-hidden, which is why this checks for copies rather than that.)
    expect(html).not.toContain('data-typewriter')
    expect(html.split(HERO.headlineLine1).length - 1).toBe(1)
    expect(html.split(HERO.headlineLine2).length - 1).toBe(1)
  })

  test('turning the hero headline on brings back the two-copy machinery', () => {
    const html = renderToStaticMarkup(
      createElement(HeroHeadline, { ...HEADLINE, animate: true })
    )

    expect(copyText(html, 'reserved')).toContain(HERO.headlineLine1)
    expect(copyText(html, 'reserved')).toContain(HERO.headlineLine2)
    expect(copyText(html, 'typed').trim()).toBe('')
    expect(html).toContain(
      `aria-label="${HERO.headlineLine1} ${HERO.headlineLine2}"`
    )
  })

  test('a quote ships complete and keeps a copy for assistive tech', () => {
    const quote = DOES_NOT_CATCH.exhibit01.quote
    const html = renderToStaticMarkup(
      createElement(TypewriterQuote, { children: quote })
    )

    // Once for assistive tech, once in the flow. The visual copy is hidden
    // from assistive tech, which must never hear a half-typed string.
    expect(html.split(quote).length - 1).toBe(2)
    expect(html).toContain('sr-only')
  })

  test('the whole quote stays in the flow, so its line breaks never move', () => {
    const quote = DOES_NOT_CATCH.exhibit01.quote
    const html = renderToStaticMarkup(
      createElement(TypewriterQuote, { children: quote })
    )

    // Nothing typed yet, so the untyped tail carries the entire quote and the
    // paragraph already lays out at its finished size.
    expect(copyText(html, 'untyped')).toContain(quote)
  })

  test('the arming script only opts out for reduced motion', () => {
    const html = renderToStaticMarkup(createElement(TypewriterArmingScript))

    expect(html).toContain('prefers-reduced-motion: reduce')
    expect(TYPEWRITER_ARMED_CLASS).not.toBe('')
    expect(html).toContain(TYPEWRITER_ARMED_CLASS)
    // The animation replays on every page load, so the script must not persist
    // "already ran" anywhere. Checked by absence because there is nothing to
    // observe from a static render.
    for (const api of ['sessionStorage', 'localStorage', 'cookie']) {
      expect(html).not.toContain(api)
    }
  })
})

describe('chatcontrol SEO', () => {
  test('the description fits what search results actually show', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    })

    expect(metadata.description).toBeTruthy()
    expect(metadata.description!.length).toBeLessThanOrEqual(160)
    expect(metadata.title).toBeTruthy()
    expect(String(metadata.title).length).toBeLessThanOrEqual(60)
  })

  test('canonical and og url point at the campaign route', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    })

    expect(String(metadata.alternates?.canonical)).toContain(ROUTES.chatControl)
    expect(String(metadata.openGraph?.url)).toContain(ROUTES.chatControl)
  })

  test('the page describes itself the same way everywhere', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    })
    const article = createCampaignArticleJsonLd('en') as Record<string, unknown>

    // One description of the page, not one for search and another for crawlers.
    expect(article.description).toBe(metadata.description)
    expect(article.description).toBe(SEO.description)
  })

  test('the article cites every source the case file lists', () => {
    const article = createCampaignArticleJsonLd('en') as Record<string, unknown>
    const citations = article.citation as ReadonlyArray<{ url: string }>

    expect(article['@type']).toBe('Article')
    expect(article.image).toBeTruthy()
    expect(citations).toHaveLength(CASE_FILE.sources.length)
    expect(citations.map((c) => c.url)).toEqual(
      CASE_FILE.sources.map((source) => source.href)
    )
  })

  test('the breadcrumb runs from the site root to this page', () => {
    const crumb = createCampaignBreadcrumbJsonLd('en') as Record<string, unknown>
    const items = crumb.itemListElement as ReadonlyArray<{
      position: number
      item: string
    }>

    expect(crumb['@type']).toBe('BreadcrumbList')
    expect(items.map((i) => i.position)).toEqual([1, 2])
    expect(items[1]!.item).toContain(ROUTES.chatControl)
  })

  test('both blocks render as parseable JSON-LD on the page', async () => {
    const html = await pageHtml()
    const blocks = [
      ...html.matchAll(
        /<script type="application\/ld\+json">(.*?)<\/script>/g
      ),
    ].map((match) => JSON.parse(match[1]!.replace(/\\u003c/g, '<')))

    expect(blocks).toHaveLength(2)
    expect(blocks.map((b) => b['@type'])).toEqual(['Article', 'BreadcrumbList'])
  })
})
