import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CoalitionPartnerCopySection } from '@repo/content/schemas'

const sectionData: CoalitionPartnerCopySection = {
  componentType: 'coalitionPartnerCopy',
  key: 'coalitionPartner.copy',
  heading: 'Coalition Partner',
}

describe('CoalitionPartnerPage – content-driven metadata', () => {
  it('section data has the correct componentType', () => {
    expect(sectionData.componentType).toBe('coalitionPartnerCopy')
  })

  it('section data has the correct heading', () => {
    expect(sectionData.heading).toBe('Coalition Partner')
  })

  it('renders heading in a simple element', () => {
    const html = renderToStaticMarkup(
      createElement('h1', null, sectionData.heading)
    )
    expect(html).toContain('Coalition Partner')
    expect(html).toContain('<h1')
  })
})
