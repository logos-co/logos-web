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
  RIGHT_QUESTION,
  WE_ALL_PAY,
} from '../_content'
import CatchNoOnePage from '../page'
import {
  TYPEWRITER_ARMED_CLASS,
  TypewriterArmingScript,
  TypewriterHeadline,
  TypewriterQuote,
} from '../_sections/typewriter'

/** Pulls the text of one of a typewriter's two visual copies. */
const copyText = (html: string, which: 'reserved' | 'typed'): string => {
  const at = html.indexOf(`data-typewriter="${which}"`)
  if (at === -1) throw new Error(`no ${which} copy rendered`)
  const open = html.indexOf('>', at) + 1
  return html.slice(open).replace(/<[^>]*>/g, '')
}

const pageHtml = () => renderToStaticMarkup(createElement(CatchNoOnePage))

describe('catch-no-one page contract', () => {
  test('is registered on the canonical route', () => {
    expect(ROUTES.catchNoOne).toBe('/catch-no-one')
  })

  test('exhibits are numbered 01–04 across the page', () => {
    const labels = [
      DOES_NOT_CATCH.exhibit01.label,
      DOES_NOT_CATCH.exhibit02.label,
      WE_ALL_PAY.exhibit03.label,
      RIGHT_QUESTION.exhibit04.label,
    ]
    expect(labels).toEqual([
      'Exhibit 01',
      'Exhibit 02',
      'Exhibit 03',
      'Exhibit 04',
    ])
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

describe('catch-no-one page render', () => {
  test('renders every section with its heading, in Figma order', () => {
    const html = pageHtml()
    const headings = [
      'What the laws say they do',
      'It doesn’t catch them',
      'We all pay',
      'Ask the right question',
      'What it takes',
      'The case file',
    ]

    let cursor = -1
    for (const heading of headings) {
      const at = html.indexOf(heading)
      expect(at, `missing heading "${heading}"`).toBeGreaterThan(-1)
      expect(at, `heading "${heading}" is out of order`).toBeGreaterThan(cursor)
      cursor = at
    }
  })

  test('renders every exhibit quote and case-file source', () => {
    const html = pageHtml()

    for (const exhibit of [
      DOES_NOT_CATCH.exhibit01,
      DOES_NOT_CATCH.exhibit02,
      WE_ALL_PAY.exhibit03,
      RIGHT_QUESTION.exhibit04,
    ]) {
      expect(html).toContain(exhibit.label)
    }
    for (const source of CASE_FILE.sources) {
      expect(html).toContain(source.href)
    }
  })

  test('case-file sources open safely in a new tab', () => {
    const html = pageHtml()
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

  test('the headline ships complete for crawlers and JS-less visitors', () => {
    const html = renderToStaticMarkup(
      createElement(TypewriterHeadline, HEADLINE)
    )

    expect(copyText(html, 'reserved')).toContain(HERO.headlineLine1)
    expect(copyText(html, 'reserved')).toContain(HERO.headlineLine2)
    expect(html).toContain(
      `aria-label="${HERO.headlineLine1} ${HERO.headlineLine2}"`
    )
  })

  test('the headline copy that animates starts empty, so nothing flashes', () => {
    const html = renderToStaticMarkup(
      createElement(TypewriterHeadline, HEADLINE)
    )

    expect(copyText(html, 'typed').trim()).toBe('')
  })

  test('a quote ships complete and keeps a copy for assistive tech', () => {
    const quote = DOES_NOT_CATCH.exhibit01.quote
    const html = renderToStaticMarkup(
      createElement(TypewriterQuote, { children: quote })
    )

    expect(copyText(html, 'reserved')).toContain(quote)
    expect(copyText(html, 'typed').trim()).toBe('')
    // Both visual copies are hidden from assistive tech, so the quote has to
    // reach it some other way.
    expect(html).toContain('sr-only')
  })

  test('the arming script only opts out for reduced motion', () => {
    const html = renderToStaticMarkup(createElement(TypewriterArmingScript))

    expect(html).toContain('prefers-reduced-motion: reduce')
    expect(TYPEWRITER_ARMED_CLASS).not.toBe('')
    expect(html).toContain(TYPEWRITER_ARMED_CLASS)
    // The run is not gated on storage — it replays on every page load.
    expect(html).not.toContain('sessionStorage')
  })
})
