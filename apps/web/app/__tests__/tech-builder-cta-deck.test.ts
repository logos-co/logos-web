import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TechBuilderCtaDeck } from '@acid-info/logos-ui'

describe('TechBuilderCtaDeck', () => {
  it('renders an explicit full-card link overlay for CTA cards', () => {
    const html = renderToStaticMarkup(
      createElement(TechBuilderCtaDeck, {
        cards: [
          {
            title: 'Basecamp Documentation',
            description: 'Read the docs',
            linkOverlay: createElement('a', {
              href: 'https://docs.logos.co/',
              'aria-hidden': true,
              tabIndex: -1,
            }),
            cta: createElement('a', {
              href: 'https://docs.logos.co/',
            }),
          },
        ],
      })
    )

    expect(html).toContain(
      '<a href="https://docs.logos.co/" aria-hidden="true" tabindex="-1"></a>'
    )
  })
})
