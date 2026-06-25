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

  it('contains no get-started or movement page copy in messages.pages', () => {
    const pages = (messages as { pages: Record<string, unknown> }).pages
    expect(Object.keys(pages)).not.toContain('getStarted')
    expect(Object.keys(pages)).not.toContain('movement')
  })

  it('contains no migrated navbar page copy in messages.pages (content owns these)', () => {
    const pages = (messages as { pages: Record<string, unknown> }).pages
    const migratedNamespaces = [
      'book',
      'brandKit',
      'research',
      'nodeProgramme',
      'lambdaPrize',
      'manifesto',
      'blog',
      'podcast',
      'logosBroadcastNetwork',
      'technologyStack',
    ]
    for (const ns of migratedNamespaces) {
      expect(Object.keys(pages)).not.toContain(ns)
    }
  })
})
