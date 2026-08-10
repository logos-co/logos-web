import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@acid-info/logos-ui', () => ({
  Button: ({
    children,
    href,
    linkAs: LinkAs = 'a',
    ...props
  }: {
    children: ReactNode
    href: string
    linkAs?: 'a' | ComponentType<{ children: ReactNode; href: string }>
  }) => createElement(LinkAs, { href, ...props, children }),
  ButtonArrowIcon: () => null,
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href, 'data-intl-link': true }, children),
}))

import { Button } from '../button'

describe('Button', () => {
  test('renders same-page hashes as native anchors', () => {
    const html = renderToStaticMarkup(
      createElement(Button, { href: '#circles-map', children: 'Join' })
    )

    expect(html).toContain('href="#circles-map"')
    expect(html).not.toContain('data-intl-link')
  })

  test('keeps internal routes on the locale-aware link', () => {
    const html = renderToStaticMarkup(
      createElement(Button, { href: '/movement', children: 'Movement' })
    )

    expect(html).toContain('data-intl-link="true"')
  })
})
