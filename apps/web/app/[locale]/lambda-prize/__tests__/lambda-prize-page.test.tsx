// @vitest-environment happy-dom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { lambdaPrizeCopySectionSchema } from '@repo/content/schemas'
import { parsePrizeMarkdown } from '@/lib/lambda-prizes-github'
import { resolvePrizeProgramme } from '@/lib/lambda-programme'
import lambdaPrizePage from '../../../../../../content/pages/en/lambda-prize.json' with { type: 'json' }

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement('img', { src, alt }),
}))
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) =>
    createElement('a', props, children),
}))

import { LambdaPrizePage } from '../_sections/lambda-prize-page'

const copy = lambdaPrizeCopySectionSchema.parse(lambdaPrizePage.sections[0])
const walletHref =
  'https://github.com/logos-co/lambda-prize/blob/master/prizes/LP-0021.md'
const wallet = parsePrizeMarkdown(
  [
    '# LP-0021: LEZ Wallet [OPEN]',
    '**`Status: Open`**',
    '## Overview',
    'A wallet with public and private accounts.',
    '## Prize Structure',
    '- **Total Prize:** $21,000',
    '- **Effort:** X-Large',
  ].join('\n'),
  'LP-0021',
  walletHref
)
const draft = {
  ...wallet,
  id: 'LP-0022',
  title: 'Upcoming test prize',
  status: 'draft' as const,
  href: walletHref.replace('0021', '0022'),
}
const newPrize = {
  ...wallet,
  id: 'LP-0100',
  title: 'New test prize',
  amount: 1000,
}
const labels = {
  open: 'Open',
  comingSoon: 'Coming soon',
  learnMore: 'Learn more',
}
const formatAmount = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format
const source = {
  prizes: [wallet, draft, newPrize],
  awardedIds: new Set<string>(),
}
const resolve = (data = copy, input = source) =>
  resolvePrizeProgramme(data, input, formatAmount, labels)

const render = (data = copy, input = source) =>
  renderToStaticMarkup(
    createElement(LambdaPrizePage, {
      programme: {
        copy: data,
        ...resolve(data, input),
        openDescription: '',
        awardedDescription: '',
      },
    })
  )

describe('Lambda Prize v3', () => {
  it('renders the complete page from CMS copy', () => {
    const html = render()
    for (const text of [
      'How it works.',
      'Featured prizes',
      'The Rules',
      'Already rewarded.',
      'Resources',
      'Pick a prize. Start building.',
    ]) {
      expect(html).toContain(text)
    }
    expect(html).not.toContain('The Logos Technology Stack')
  })

  it('uses edited copy and links in the actual page components', () => {
    const updated = structuredClone(copy)
    updated.hero.heading = 'Edited programme introduction'
    updated.resources.items[0] = {
      number: '01',
      title: 'Updated documentation',
      cta: { label: 'Read it', href: 'https://docs.logos.co/updated' },
    }
    updated.rewarded.solutions[0].cta.href =
      'https://github.com/example/new-solution'
    const html = render(updated)
    expect(html).toContain('Edited programme introduction')
    expect(html).toContain('Updated documentation')
    expect(html).toContain('https://docs.logos.co/updated')
    expect(html).toContain('https://github.com/example/new-solution')
  })

  it('renders shared headings and the same edited RFP copy in both layouts', () => {
    const updated = structuredClone(copy)
    updated.howItWorks.requirements.heading = 'Shared requirements'
    updated.rewarded.heading = 'Shared solutions'
    updated.resources.rfp.title = 'Shared funding title'
    updated.resources.rfp.body = 'Shared funding description'
    const html = render(updated)
    for (const text of ['Shared requirements', 'Shared solutions']) {
      expect(html.split(text)).toHaveLength(2)
    }
    for (const text of ['Shared funding title', 'Shared funding description']) {
      expect(html.split(text)).toHaveLength(3)
    }
    expect(() =>
      lambdaPrizeCopySectionSchema.parse({
        ...updated,
        rewarded: { ...updated.rewarded, heading: '' },
      })
    ).toThrow()
  })

  it('uses the GitHub amount and title in both listings and the total', () => {
    const html = render()
    const container = document.createElement('div')
    container.innerHTML = html
    expect(html).toContain('$22,000')
    expect(
      [...container.querySelectorAll('h3')].filter(
        (heading) => heading.textContent === 'LEZ Wallet'
      )
    ).toHaveLength(2)
    const card = container.querySelector(
      '[aria-labelledby="featured-heading"] a[aria-label="LEZ Wallet"]'
    )!
    expect(card.getAttribute('href')).toBe(walletHref)
    expect(card.textContent).toContain('$21,000')
    expect(card.querySelector('a, button')).toBeNull()
    expect(html).toContain('New test prize')
  })

  it('replaces a closed recommendation and keeps unapproved drafts hidden', () => {
    const result = resolve(copy, {
      prizes: [
        { ...wallet, status: 'closed' },
        newPrize,
        draft,
        { ...draft, id: 'LP-0101' },
      ],
      awardedIds: new Set([wallet.id]),
    })
    expect(result.recommended?.id).toBe(newPrize.id)
    expect(result.openTotal).toBe('$1,000')
    expect(result.awardedCount).toBe(1)
    expect(result.cards.map(({ id, status }) => [id, status])).toEqual([
      [newPrize.id, 'open'],
      [draft.id, 'coming-soon'],
    ])
  })

  it('links navigation to real section anchors and leaves coming-soon prizes without an action', () => {
    const html = render()
    for (const link of copy.hero.jumpLinks) {
      expect(html).toContain(`href="${link.href}"`)
      expect(html).toContain(`id="${link.href.slice(1)}"`)
    }
    const upcoming = resolve().cards.find(
      (prize) => prize.status === 'coming-soon'
    )
    expect(upcoming?.cta).toBeUndefined()
    expect(html).not.toContain('/prizes/LP-0022.md')
  })
})
