import { describe, expect, it } from 'vitest'

import messages from '../../messages/en.json' with { type: 'json' }

describe('messages ownership contract', () => {
  it('contains no home page-copy namespace (content owns home copy)', () => {
    expect(Object.keys(messages)).not.toContain('home')
  })

  it('keeps shared chrome namespaces', () => {
    for (const key of ['common', 'pages', 'connectForm'] as const) {
      expect(messages).toHaveProperty(key)
    }
  })
})
