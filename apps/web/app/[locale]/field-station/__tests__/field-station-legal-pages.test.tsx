import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import { getLegalDoc } from '@/lib/legal-content'

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode
    href: string
  } & Record<string, unknown>) => createElement('a', props, children),
}))

vi.mock('next-intl/server', () => ({
  setRequestLocale: () => undefined,
}))

import { LEGAL_LINKS } from '../_content'
import * as privacyPage from '../privacy-policy/page'
import * as termsPage from '../terms-and-conditions/page'

const params = Promise.resolve({ locale: 'en' })

const escapeHtml = (text: string) =>
  renderToStaticMarkup(createElement('span', null, text)).slice(6, -7)

describe.each([
  {
    name: 'application terms',
    page: termsPage,
    slug: 'field-station-application-terms',
    route: ROUTES.fieldStationTerms,
  },
  {
    name: 'privacy policy',
    page: privacyPage,
    slug: 'field-station-privacy-policy',
    route: ROUTES.fieldStationPrivacy,
  },
])('field station $name page', ({ page, slug, route }) => {
  const doc = getLegalDoc(slug)

  test('takes its title and description from the document', async () => {
    const metadata = await page.generateMetadata({ params })

    expect(metadata.title).toBe(doc.title)
    expect(metadata.description).toBe(doc.description)
    expect(metadata.alternates?.canonical).toMatch(new RegExp(`${route}$`))
  })

  test('renders the document beside the Field Station legal navigation', async () => {
    const html = renderToStaticMarkup(await page.default({ params }))
    const nav = html.match(/<nav\b[^>]*>.*?<\/nav>/s)?.[0] ?? ''

    expect(html).toContain(escapeHtml(doc.heading))
    expect(html).toMatch(/Last updated: \d{1,2} [A-Z][a-z]+ \d{4}/)
    expect(nav).toContain(`href="${ROUTES.fieldStation}"`)

    for (const link of LEGAL_LINKS) {
      if (link.href === route) {
        expect(nav).toMatch(
          new RegExp(`aria-current="page"[^>]*>.*?${link.label}`, 's')
        )
        expect(nav).not.toContain(`href="${link.href}"`)
      } else {
        expect(nav).toContain(`href="${link.href}"`)
      }
    }
  })
})
