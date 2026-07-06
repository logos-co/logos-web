import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { manifestoCopySectionSchema, pageSectionSchema } from '../pages'

const MINIMAL_SECTION = {
  componentType: 'manifestoCopy' as const,
  key: 'manifesto.copy',
  heading: 'Logos: A Declaration of Independence in Cyberspace',
  headingLine1: 'Logos: A Declaration of',
  headingLine2: 'Independence in Cyberspace',
  author: ['Jarrad Hope', 'jarrad@logos.co', 'logos.co', 'PGP : openpgp.org'],
  abstractHeading: 'Abstract.',
  abstractBody: 'A fully decentralised tech stack.',
  keywordsHeading: 'Keywords',
  keywords: 'Network privacy, CBDCs',
  body: [
    'Every once in a while a revolutionary idea appears.',
    'We will stop only when anybody, anywhere, can experience it.',
  ],
  moreHeading: 'More from Jarrad Hope',
  more: ['Farewell to Westphalia', 'Living Within the Truth | Parallel Society'],
}

describe('manifestoCopySection schema', () => {
  it('parses a valid manifestoCopy section', () => {
    const result = manifestoCopySectionSchema.parse(MINIMAL_SECTION)
    assert.equal(result.componentType, 'manifestoCopy')
    assert.equal(result.body[0], 'Every once in a while a revolutionary idea appears.')
    assert.equal(result.body[1], 'We will stop only when anybody, anywhere, can experience it.')
    assert.equal(result.headingLine1, 'Logos: A Declaration of')
    assert.equal(result.abstractBody, 'A fully decentralised tech stack.')
    assert.equal(result.author.length, 4)
    assert.equal(result.more.length, 2)
  })

  it('is accepted by the pageSectionSchema discriminated union', () => {
    const result = pageSectionSchema.parse(MINIMAL_SECTION)
    assert.equal(result.componentType, 'manifestoCopy')
  })

  it('rejects when body contains an empty string', () => {
    assert.throws(() =>
      manifestoCopySectionSchema.parse({ ...MINIMAL_SECTION, body: [''] })
    )
  })

  it('rejects when a required string is empty', () => {
    assert.throws(() =>
      manifestoCopySectionSchema.parse({ ...MINIMAL_SECTION, heading: '' })
    )
  })
})
