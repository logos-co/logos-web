import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActivistLeaderStewardCopySection } from '@repo/content/schemas'

const sectionData: ActivistLeaderStewardCopySection = {
  componentType: 'activistLeaderStewardCopy',
  key: 'activistLeaderSteward.copy',
  heading: 'Activist Leader / Steward',
  intro: 'Activist Leader / Steward intro.',
  privacy: 'Activist Leader / Steward privacy.',
  privacyLink: 'https://logos.co/privacy-policy',
}

describe('ActivistLeaderStewardPage – content-driven metadata', () => {
  it('section data has the correct componentType', () => {
    expect(sectionData.componentType).toBe('activistLeaderStewardCopy')
  })

  it('section data has the correct heading', () => {
    expect(sectionData.heading).toBe('Activist Leader / Steward')
  })

  it('renders heading in a simple element', () => {
    const html = renderToStaticMarkup(
      createElement('h1', null, sectionData.heading)
    )
    expect(html).toContain('Activist Leader / Steward')
    expect(html).toContain('<h1')
  })

  it('has CMS-backed form page copy', () => {
    expect(sectionData.intro).toBe('Activist Leader / Steward intro.')
    expect(sectionData.privacy).toBe('Activist Leader / Steward privacy.')
    expect(sectionData.privacyLink).toBe('https://logos.co/privacy-policy')
  })
})
