import { afterEach, describe, expect, test, vi } from 'vitest'

import { discoverOnOpenCollective } from './open-collective-source'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Open Collective discovery', () => {
  test('requests only non-person account types and stores aggregate evidence', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: {
              accounts: {
                nodes: [
                  {
                    slug: 'community-privacy',
                    name: 'Community Privacy',
                    description: 'Privacy infrastructure for local communities',
                    website: 'https://communityprivacy.example',
                    type: 'COLLECTIVE',
                    isActive: true,
                    updatedAt: '2026-08-10T12:00:00.000Z',
                    tags: ['privacy', 'infrastructure'],
                    stats: { contributorsCount: 42 },
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    )
    vi.stubGlobal('fetch', fetchMock)

    const candidates = await discoverOnOpenCollective('privacy infrastructure')

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      displayName: 'Community Privacy',
      entityType: 'community',
      domain: 'communityprivacy.example',
    })
    expect(candidates[0]?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'contribution_path' }),
        expect.objectContaining({ field: 'theme_match' }),
      ])
    )

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body)
    expect(requestBody).toContain(
      'type: [COLLECTIVE, FUND, ORGANIZATION, PROJECT]'
    )
    expect(requestBody).not.toMatch(/members|email/i)
  })
})
