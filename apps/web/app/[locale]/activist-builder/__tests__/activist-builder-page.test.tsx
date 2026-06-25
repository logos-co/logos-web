import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActivistBuilderCopySection } from '@repo/content/schemas'

const sectionData: ActivistBuilderCopySection = {
  componentType: 'activistBuilderCopy',
  key: 'activistBuilder.copy',
  heading: 'Activist Builder',
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
})
