import { describe, expect, it } from 'vitest'

import { getLegalDoc } from './legal-content'

describe('getLegalDoc', () => {
  it('loads the testnet FAQ document with frontmatter and body', () => {
    const doc = getLegalDoc('testnet-faqs')

    // Wording can change; only guard the structure: a "| Logos" title,
    // a non-empty heading/description, and a markdown body with headings.
    expect(doc.title).toContain('| Logos')
    expect(doc.heading.trim().length).toBeGreaterThan(0)
    expect(doc.description.length).toBeGreaterThan(0)
    expect(doc.body).toContain('##')
  })

  it('strips frontmatter from the returned body', () => {
    const doc = getLegalDoc('terms-and-conditions')

    expect(doc.heading.trim().length).toBeGreaterThan(0)
    expect(doc.body.trim().length).toBeGreaterThan(0)
    // The behavioural guarantee: no leading frontmatter delimiter leaks in.
    expect(doc.body.startsWith('---')).toBe(false)
  })

  it('loads each migrated legal document', () => {
    for (const slug of [
      'terms-and-conditions',
      'privacy-policy',
      'security',
      'operators-terms-of-use',
      'operators-privacy-policy',
      'operators-disclaimer',
      'field-station-application-terms',
      'field-station-privacy-policy',
    ]) {
      const doc = getLegalDoc(slug)
      expect(doc.title).toContain('| Logos')
      expect(doc.body.length).toBeGreaterThan(0)
    }
  })

  it('numbers the Field Station application terms as one list of sections', () => {
    const terms = getLegalDoc('field-station-application-terms')
    const sections = terms.body.match(/^## .+$/gm) ?? []

    // The Google Docs export restarts the numbering at "Application"; the
    // published page keeps one running sequence.
    expect(sections).toHaveLength(13)
    expect(sections[0]).toBe('## 1. About these Terms')
    expect(sections[2]).toBe('## 3. Application')
    expect(sections[12]).toBe('## 13. Application confirmation')
    expect(terms.body).toContain('Last updated: 16 September 2026')
  })

  it('keeps the Field Station privacy policy sections and contact', () => {
    const privacy = getLegalDoc('field-station-privacy-policy')
    const sections = privacy.body.match(/^## .+$/gm) ?? []

    expect(sections).toHaveLength(7)
    expect(sections[0]).toBe('## 1. Introduction')
    expect(sections[6]).toBe('## 7. Additional information')
    expect(privacy.body).toContain('Last updated: 16 September 2026')
    expect(privacy.body).toContain(
      '[legal@free.technology](mailto:legal@free.technology)'
    )
  })

  it('keeps operator legal documents in renderable markdown structure', () => {
    const terms = getLegalDoc('operators-terms-of-use')
    const privacy = getLegalDoc('operators-privacy-policy')

    expect(terms.body).toContain(
      '# Logos Operators Dashboard - Website Terms of Use'
    )
    expect(terms.body).toContain('## 1. Who we are')
    expect(terms.body).toContain('1. engage in, promote')
    expect(terms.body).not.toContain('1) **Who we are**')

    expect(privacy.body).toContain(
      '# Logos Operators Dashboard - Website Privacy Policy'
    )
    expect(privacy.body).toContain('## 1. Who we are')
    expect(privacy.body).toContain(
      '1. Providing you with access to certain functionalities'
    )
    expect(privacy.body).not.toContain('1) ### **Who we are**')
  })

  it('loads the operator sunset disclaimer as markdown', () => {
    const disclaimer = getLegalDoc('operators-disclaimer')

    expect(disclaimer.body).toContain(
      '# Disclaimer - Sunset of Logos Operators'
    )
    expect(disclaimer.body).toContain('## Privacy policy addendum')
    expect(disclaimer.body).toContain('1. Name;')
    expect(disclaimer.body).toContain('https://logos.co/privacy-policy')
  })

  it('throws a descriptive error when the document is missing', () => {
    expect(() => getLegalDoc('does-not-exist')).toThrow(
      /failed to read legal document "does-not-exist"/
    )
  })
})
