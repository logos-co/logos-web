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
    for (const slug of ['terms-and-conditions', 'privacy-policy', 'security']) {
      const doc = getLegalDoc(slug)
      expect(doc.title).toContain('| Logos')
      expect(doc.body.length).toBeGreaterThan(0)
    }
  })

  it('throws a descriptive error when the document is missing', () => {
    expect(() => getLegalDoc('does-not-exist')).toThrow(
      /failed to read legal document "does-not-exist"/
    )
  })
})
