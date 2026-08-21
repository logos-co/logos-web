import { describe, expect, test } from 'vitest'

import { sourceSearchTerms } from './source-query'

describe('source search terms', () => {
  test('keeps the first distinct topics and drops brief wording', () => {
    expect(
      sourceSearchTerms(
        'Privacy and networking organisations with active open-source work'
      )
    ).toEqual(['privacy', 'networking'])
  })

  test('keeps a product or protocol name intact', () => {
    expect(sourceSearchTerms('libp2p')).toEqual(['libp2p'])
  })
})
