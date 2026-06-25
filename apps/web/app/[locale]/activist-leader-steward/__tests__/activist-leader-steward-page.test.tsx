import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActivistLeaderStewardCopySection } from '@repo/content/schemas'

const sectionData: ActivistLeaderStewardCopySection = {
  componentType: 'activistLeaderStewardCopy',
  key: 'activistLeaderSteward.copy',
  heading: 'Activist Leader / Steward',
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
})
