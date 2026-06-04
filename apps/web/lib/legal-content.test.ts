import { describe, expect, it } from 'vitest'

import { getLegalDoc } from './legal-content'

describe('getLegalDoc', () => {
  it('loads the testnet FAQ document with frontmatter and body', () => {
    const doc = getLegalDoc('testnet-v01-faqs')

    expect(doc.title).toBe('Testnet v0.1 FAQs | Logos')
    expect(doc.heading).toBe('Logos Testnet v0.1 FAQs')
    expect(doc.description.length).toBeGreaterThan(0)
    expect(doc.body).toContain('## What is Logos Testnet?')
  })

  it('strips frontmatter from the returned body', () => {
    const doc = getLegalDoc('terms-and-conditions')

    expect(doc.heading).toBe('Terms & Conditions')
    expect(doc.body).not.toContain('---')
    expect(doc.body.startsWith('Last updated')).toBe(true)
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
