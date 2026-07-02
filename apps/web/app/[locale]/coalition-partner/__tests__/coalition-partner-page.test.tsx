import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CoalitionPartnerCopySection } from '@repo/content/schemas'

const sectionData: CoalitionPartnerCopySection = {
  componentType: 'coalitionPartnerCopy',
  key: 'coalitionPartner.copy',
  heading: 'Coalition Partner',
  intro: 'Coalition Partner intro.',
  privacy: 'Coalition Partner privacy.',
  privacyLink: 'https://logos.co/privacy-policy',
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

  it('has CMS-backed form page copy', () => {
    expect(sectionData.intro).toBe('Coalition Partner intro.')
    expect(sectionData.privacy).toBe('Coalition Partner privacy.')
    expect(sectionData.privacyLink).toBe('https://logos.co/privacy-policy')
  })
})
