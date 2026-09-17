import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode
    href: string
  } & Record<string, unknown>) => createElement('a', props, children),
}))

import { MediaBreadcrumb } from '../_components/media-breadcrumb'

describe('MediaBreadcrumb', () => {
  it('links each parent section in order inside a labelled nav', () => {
    const html = renderToStaticMarkup(
      <MediaBreadcrumb
        label="Breadcrumb"
        items={[
          { name: 'Media', path: '/media' },
          { name: 'Articles', path: '/media#articles' },
        ]}
      />
    )

    expect(html).toContain('<nav aria-label="Breadcrumb"')
    expect(html).toContain('<ol')
    const media = html.indexOf('href="/media"')
    const articles = html.indexOf('href="/media#articles"')
    expect(media).toBeGreaterThan(-1)
    expect(articles).toBeGreaterThan(media)
    expect(html).toContain('>Media</a>')
    expect(html).toContain('>Articles</a>')
  })

  it('hides the separators from assistive technology', () => {
    const html = renderToStaticMarkup(
      <MediaBreadcrumb
        label="Breadcrumb"
        items={[
          { name: 'Media', path: '/media' },
          { name: 'Podcasts', path: '/media#podcasts' },
        ]}
      />
    )

    expect(html.match(/aria-hidden="true">\/</g)).toHaveLength(1)
  })

  it('renders nothing without items', () => {
    expect(
      renderToStaticMarkup(<MediaBreadcrumb label="Breadcrumb" items={[]} />)
    ).toBe('')
  })
})
