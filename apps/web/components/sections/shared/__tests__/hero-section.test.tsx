import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag: string) =>
        ({
          children,
          initial: _initial,
          animate: _animate,
          transition: _transition,
          ...props
        }: {
          children?: ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
        }) =>
          createElement(tag, props, children),
    }
  ),
  useScroll: () => ({ scrollYProgress: 0 }),
  useTransform: () => 1,
}))

vi.mock('@/components/ui', () => ({
  Button: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
  }) => createElement('a', { href, ...props }, children),
}))

import HeroSectionView from '../hero-section'

const data = {
  componentType: 'hero' as const,
  key: 'buildTheParallel.atf',
  headline: 'Build the Parallel',
  bodySecondary: 'Supporting copy',
  ctas: [
    { label: 'Join', href: '#circles-map', variant: 'primary' as const },
    {
      label: 'Join the community',
      href: 'https://discord.com/invite/Ykv4eZyHUJ',
      variant: 'secondary' as const,
    },
  ],
}

describe('HeroSectionView', () => {
  test('renders CTA hrefs and stable analytics names', () => {
    const html = renderToStaticMarkup(
      createElement(HeroSectionView, {
        data,
        background: createElement('div'),
        ctaEventNames: ['Join an upcoming circle', 'Join the community'],
      })
    )

    expect(html).toContain('href="#circles-map"')
    expect(html).toContain('data-umami-event-name="Join an upcoming circle"')
    expect(html).toContain(
      'href="https://discord.com/invite/Ykv4eZyHUJ"'
    )
    expect(html).toContain('data-umami-event-name="Join the community"')
  })
})
