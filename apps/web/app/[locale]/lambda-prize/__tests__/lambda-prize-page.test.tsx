import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { lambdaPrizeCopySectionSchema } from '@repo/content/schemas'
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
const render = (data = copy) =>
  renderToStaticMarkup(createElement(LambdaPrizePage, { copy: data }))

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

  it('renders independently edited mobile copy from CMS without replacing desktop copy', () => {
    const updated = structuredClone(copy)
    updated.howItWorks.requirements.mobileHeading = 'Mobile requirements'
    updated.rewarded.mobileHeading = 'Mobile solutions'
    updated.resources.rfp.mobile = {
      title: 'Mobile funding title',
      body: 'Mobile funding description',
    }
    const html = render(updated)
    for (const text of [
      'Mobile requirements',
      'Mobile solutions',
      'Mobile funding title',
      'Mobile funding description',
      copy.rewarded.heading,
      copy.resources.rfp.body,
    ]) {
      expect(html).toContain(text)
    }
    expect(() =>
      lambdaPrizeCopySectionSchema.parse({
        ...updated,
        rewarded: { ...updated.rewarded, mobileHeading: '' },
      })
    ).toThrow()
  })

  it('uses the same prize data for featured and open listings', () => {
    const updated = structuredClone(copy)
    updated.prizes[0].amount = '$21,000'
    updated.prizes[0].title = 'Updated wallet'
    const html = render(updated)
    expect(html.match(/\$21,000/g)).toHaveLength(2)
    expect(html.match(/Updated wallet/g)).toHaveLength(2)
  })

  it('links navigation to real section anchors and leaves coming-soon prizes without an action', () => {
    const html = render()
    for (const link of copy.hero.jumpLinks) {
      expect(html).toContain(`href="${link.href}"`)
      expect(html).toContain(`id="${link.href.slice(1)}"`)
    }
    const upcoming = copy.prizes.find((prize) => prize.status === 'coming-soon')
    expect(upcoming?.cta).toBeUndefined()
    expect(html).not.toContain('/prizes/LP-0022.md')
  })
})
