import { afterEach, describe, expect, test, vi } from 'vitest'

import { discoverOnCodeberg } from './codeberg-source'

afterEach(() => {
  vi.unstubAllGlobals()
})

const repository = {
  name: 'private-network',
  full_name: 'privacy-foundation/private-network',
  html_url: 'https://codeberg.org/privacy-foundation/private-network',
  description: 'A censorship-resistant private network',
  website: 'https://docs.privacy.example',
  updated_at: '2026-08-15T12:00:00.000Z',
  archived: false,
  fork: false,
  mirror: false,
  private: false,
  has_issues: true,
  stars_count: 18,
  topics: ['privacy', 'networking'],
}

describe('Codeberg discovery', () => {
  test('skips personal owners and extracts only verified organisations', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/repos/search')) {
        return new Response(
          JSON.stringify({
            data: [
              { ...repository, owner: { login: 'individual-owner' } },
              {
                ...repository,
                owner: { login: 'privacy-foundation' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (url.endsWith('/orgs/individual-owner')) {
        return new Response('{}', { status: 404 })
      }

      return new Response(
        JSON.stringify({
          username: 'privacy-foundation',
          full_name: 'Privacy Foundation',
          description: 'Builds private communication infrastructure',
          website: 'https://privacy.example',
          visibility: 'public',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const candidates = await discoverOnCodeberg('privacy network')

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      displayName: 'Privacy Foundation',
      entityType: 'organisation',
      domain: 'privacy.example',
    })
    expect(candidates[0]?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'public_repository' }),
        expect.objectContaining({ field: 'contribution_path' }),
      ])
    )
    expect(
      candidates.some((candidate) =>
        candidate.displayName.includes('individual-owner')
      )
    ).toBe(false)
  })
})
