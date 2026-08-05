import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/icons/icon-mask', () => ({
  IconMask: () => null,
}))

vi.mock('@/components/ui', () => ({
  Button: ({ children, href }: { children: ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { BasecampCta } from '@/components/sections/basecamp/_sections/basecamp-cta'
import { EXTERNAL_URLS } from '@/constants/routes'

describe('BasecampCta', () => {
  it('keeps install CTAs on the platform resolver when content marks them external', () => {
    const html = renderToStaticMarkup(
      <BasecampCta
        cta={{
          label: 'Install Linux',
          href: 'https://example.com/bypassed-release',
          external: true,
          iconOverride: 'download',
        }}
      />
    )

    expect(html).toContain(`href="${EXTERNAL_URLS.basecampRelease}"`)
    expect(html).not.toContain('https://example.com/bypassed-release')
  })
})
