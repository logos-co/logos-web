import { describe, expect, it } from 'vitest'

import { buildN8nPayload } from '../build-payload'

describe('buildN8nPayload', () => {
  it('merges id-based fields into { id, label } and keeps plain fields', () => {
    const payload = buildN8nPayload(
      {
        name: 'Ada',
        city: 'Paris',
        country: '1076', // France
        skills: ['1', '9'], // Developer, Community builder
        website: ['https://example.com'],
        hearAbout: '2',
        wantsEvents: true,
        wantsNewsletter: false,
      },
      'afformActivistLeaderSteward'
    )

    expect(payload).toMatchObject({
      formName: 'afformActivistLeaderSteward',
      name: 'Ada',
      city: 'Paris',
      website: ['https://example.com'],
      wantsEvents: true,
      wantsNewsletter: false,
      country: { id: '1076', label: 'France' },
      skills: [
        { id: '1', label: 'Developer' },
        { id: '9', label: 'Community builder' },
      ],
    })
    // hearAbout resolves to a known label (exact text sourced from @repo/funnel).
    expect(payload.hearAbout).toMatchObject({ id: '2' })
    expect((payload.hearAbout as { label: string }).label.length).toBeGreaterThan(
      0
    )
  })

  it('merges chat handles with their services and drops chatService', () => {
    const payload = buildN8nPayload(
      {
        chat: ['handle_x', 'handle_tg', 'handle_dc'],
        chatService: ['3', '2', '1'], // X, Telegram, Discord
      },
      'afformActivistLeaderSteward'
    )

    expect(payload.chat).toEqual([
      { handle: 'handle_x', service: { id: '3', label: 'X' } },
      { handle: 'handle_tg', service: { id: '2', label: 'Telegram' } },
      { handle: 'handle_dc', service: { id: '1', label: 'Discord' } },
    ])
    expect('chatService' in payload).toBe(false)
  })

  it('drops empty chat rows and keeps a handle with no service', () => {
    const payload = buildN8nPayload(
      {
        chat: ['solo', '', 'paired'],
        chatService: ['', '2', '3'],
      },
      'afformActivistLeaderSteward'
    )

    // Empty handle (row 2) drops even though it has a service id.
    expect(payload.chat).toEqual([
      { handle: 'solo' },
      { handle: 'paired', service: { id: '3', label: 'X' } },
    ])
  })

  it('drops the stray socials seed key', () => {
    const payload = buildN8nPayload(
      { socials: '', name: 'Ada' },
      'afformActivistLeaderSteward'
    )

    expect('socials' in payload).toBe(false)
    expect(payload.name).toBe('Ada')
  })

  it('falls back to label = id for unknown ids without dropping the id', () => {
    const payload = buildN8nPayload(
      { country: '9999', skills: ['999'] },
      'afformActivistLeaderSteward'
    )

    expect(payload.country).toEqual({ id: '9999', label: '9999' })
    expect(payload.skills).toEqual([{ id: '999', label: '999' }])
  })

  it('normalizes scalar and empty repeatable inputs', () => {
    const payload = buildN8nPayload(
      { skills: '3', country: '' },
      'afformActivistLeaderSteward'
    )

    // scalar skill coerced to an array of one { id, label }
    expect(payload.skills).toEqual([{ id: '3', label: 'Privacy domain expert' }])
    // empty scalar leaves the raw value untouched (no { id, label } override)
    expect(payload.country).toBe('')
  })
})
