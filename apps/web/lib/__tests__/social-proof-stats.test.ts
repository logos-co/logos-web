import { afterEach, describe, expect, test, vi } from 'vitest'

import { getSocialProofStats } from '../social-proof-stats'

const jsonResponse = (payload: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => payload,
  }) as unknown as Response

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSocialProofStats', () => {
  test('maps contribution and circle API totals for the home social proof cards', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          stg_external_contributors_agg_total_ext_contributions: [
            {
              total_commits: 3441,
              total_external_collaborators: 218,
              total_repositories: 341,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            stg_external_circle_circle_event_aggregate: {
              aggregate: {
                count: 34,
              },
            },
          },
        })
      )

    await expect(getSocialProofStats()).resolves.toEqual({
      contributions: '3,441',
      contributors: '218',
      repositories: '341',
      circles: '34',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://hasura.bi.status.im/api/rest/contributions/count_all',
      { cache: 'force-cache' }
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://hasura.bi.status.im/v1/graphql',
      expect.objectContaining({
        method: 'POST',
        cache: 'force-cache',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  test('keeps the requested stats as build fallback when the APIs fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    await expect(getSocialProofStats()).resolves.toEqual({
      contributions: '3,441',
      contributors: '218',
      repositories: '341',
      circles: '34',
    })
  })
})
