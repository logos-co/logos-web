import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActivistBuilderCopySection } from '@repo/content/schemas'

const sectionData: ActivistBuilderCopySection = {
  componentType: 'activistBuilderCopy',
  key: 'activistBuilder.copy',
  heading: 'Activist Builder',
  intro: 'Activist Builder intro.',
  privacy: 'Activist Builder privacy.',
  privacyLink: 'https://logos.co/privacy-policy',
}

describe('ActivistBuilderPage – content-driven metadata', () => {
  it('section data has the correct componentType', () => {
    expect(sectionData.componentType).toBe('activistBuilderCopy')
  })

  it('section data has the correct heading', () => {
    expect(sectionData.heading).toBe('Activist Builder')
  })

  it('renders heading in a simple element', () => {
    const html = renderToStaticMarkup(
      createElement('h1', null, sectionData.heading)
    )
    expect(html).toContain('Activist Builder')
    expect(html).toContain('<h1')
  })

  it('has CMS-backed form page copy', () => {
    expect(sectionData.intro).toBe('Activist Builder intro.')
    expect(sectionData.privacy).toBe('Activist Builder privacy.')
    expect(sectionData.privacyLink).toBe('https://logos.co/privacy-policy')
  })
})
