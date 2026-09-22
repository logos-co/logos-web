import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Rfp } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    createElement('a', { href, ...props }, children),
}))

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

vi.mock('@/components/ui/lambda-lockup', () => ({
  LambdaLockup: ({ children }: { children: ReactNode }) =>
    createElement('span', null, children),
}))

import { DeveloperProgramsSection } from '../developer-programs-section'

const LONG_TAGLINE =
  'Self-organising groups can establish and enforce their own rules, with members engaging voluntarily.'

const data: NonNullable<BuilderHubSettings['programs']> = {
  title: 'Builder Programmes',
  prizeTitle: 'Prize',
  prizeHeading: 'The frontier is open.',
  prizeDescription: 'Lambda Prizes are a competitive prize framework.',
  prizeImage: { src: '/prize.jpg', alt: '' },
  prizeHref: '/lambda-prize',
  rfpsTitle: 'Explore RFPs',
  rfpsDescription: 'Browse all open requests for proposals below.',
  rfpsHref: '/rfps',
}

const rfp = {
  slug: 'community-governance-processes',
  title: 'Community Governance Processes',
  tagline: LONG_TAGLINE,
  summary: 'Summary',
  ctaLabel: 'Apply',
  featured: false,
  image: { src: '/rfp.jpg', alt: '' },
} as Rfp

function classOf(html: string, pattern: RegExp): string[] {
  const match = html.match(pattern)
  if (!match) throw new Error(`No element matches ${pattern}`)
  return match[1].split(/\s+/)
}

describe('DeveloperProgramsSection RFP card', () => {
  const html = renderToStaticMarkup(
    createElement(DeveloperProgramsSection, {
      id: 'developer-programs',
      index: '03',
      title: data.title,
      data,
      rfps: [rfp],
    })
  )

  it('keeps the CTA and tagline in the normal flow so a long tagline cannot cover the CTA', () => {
    const ctaClasses = classOf(html, /<span class="([^"]*)">Apply<\/span>/)
    const taglineClasses = classOf(
      html,
      new RegExp(`<p class="([^"]*)">${LONG_TAGLINE}</p>`)
    )

    expect(ctaClasses).not.toContain('absolute')
    expect(taglineClasses).not.toContain('absolute')
  })

  it('lets the card grow past its design height instead of clipping long copy', () => {
    const cardClasses = classOf(
      html,
      /<div class="([^"]*)"><h4[^>]*>Community Governance Processes<\/h4>/
    )

    expect(cardClasses).toContain('min-h-[166px]')
    expect(cardClasses).not.toContain('h-[166px]')
  })
})
