import type { AnchorHTMLAttributes } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import navigation from '../../../../../content/site/en/navigation.json'

const { route, overlay } = vi.hoisted(() => ({
  route: { pathname: '/basecamp' },
  overlay: vi.fn((_props: unknown) => null),
}))

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => route.pathname,
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}))

vi.mock('@acid-info/logos-ui/client', () => ({ NavOverlay: overlay }))
vi.mock('../media-search-dialog', () => ({ MediaSearchDialog: () => null }))

import SiteHeaderClient from '../site-header-client'
import { EXTERNAL_URLS } from '@/constants/routes'

const menuPanels = navigation.menuPanels.map(({ label, textSections }) => ({
  label,
  textSections,
}))

function renderHeader(pathname: string): string {
  route.pathname = pathname
  return renderToStaticMarkup(
    <SiteHeaderClient
      locale="en"
      closedBar={navigation.closedBar}
      sitemap={[]}
      community={[]}
      menuPanels={menuPanels}
      primaryCta={navigation.primaryCta}
      searchIndexUrl="/search-index/en.json"
    />
  )
}

describe('header Basecamp installation', () => {
  beforeEach(() => overlay.mockClear())

  it.each(['/basecamp', '/basecamp/', '/field-station', '/field-station/'])(
    'provides a working release link before platform detection on %s',
    (pathname) => {
      const html = renderHeader(pathname)
      const installLink = html.match(/<a\b[^>]*>Install Basecamp<\/a>/)?.[0]

      expect(installLink).toContain(`href="${EXTERNAL_URLS.basecampRelease}"`)
      expect(installLink).toContain('target="_blank"')
      expect(installLink).toContain('rel="noopener noreferrer"')

      const props = overlay.mock.calls.at(-1)?.[0] as
        | {
            primaryCta: { href: string }
            menuPanels: typeof menuPanels
          }
        | undefined
      expect(props?.primaryCta.href).toBe(EXTERNAL_URLS.basecampRelease)
      const installLinks = props?.menuPanels.flatMap((panel) =>
        (panel.textSections ?? []).flatMap((section) =>
          section.links.filter(
            (link) => link.label === navigation.primaryCta.label
          )
        )
      )
      expect(installLinks?.length).toBeGreaterThan(0)
      expect(
        installLinks?.every(
          (link) => link.href === EXTERNAL_URLS.basecampRelease
        )
      ).toBe(true)
    }
  )

  it.each(['/', '/technology-stack'])(
    'keeps the Basecamp introduction reachable from %s',
    (pathname) => {
      const html = renderHeader(pathname)
      const installLink = html.match(/<a\b[^>]*>Install Basecamp<\/a>/)?.[0]

      expect(installLink).toContain('href="/basecamp"')
      expect(installLink).not.toContain('target="_blank"')
      expect(overlay).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryCta: navigation.primaryCta,
          menuPanels,
        }),
        undefined
      )
    }
  )
})
