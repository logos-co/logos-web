import { afterEach, describe, expect, test, vi } from 'vitest'

import { getLatestPressPodcasts } from '../press-engine'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLatestPressPodcasts', () => {
  test('maps podcast search results without inventing missing fields', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          posts: [
            {
              type: 'podcast',
              data: {
                title: 'Federico Ast, Kleros: Decentralised Arbitration System',
                slug: 'federico-ast-kleros',
                publishedAt: '2024-09-18',
                coverImage: {
                  url: 'https://cms-press.logos.co/uploads/podcast.jpg',
                },
                description: 'Actual podcast description',
                episodeNumber: 14,
              },
            },
          ],
        },
      }),
    } as Response)

    const podcasts = await getLatestPressPodcasts(1)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://press.logos.co/api/search?type=podcast&limit=1',
      { cache: 'force-cache' }
    )
    expect(podcasts).toEqual([
      {
        title: 'Federico Ast, Kleros: Decentralised Arbitration System',
        image: 'https://cms-press.logos.co/uploads/podcast.jpg',
        description: 'Actual podcast description',
        date: '18 Sept 2024',
        episodeNumber: 14,
        href: 'https://press.logos.co/podcasts/logos-state/federico-ast-kleros',
      },
    ])
    expect('duration' in podcasts[0]).toBe(false)
  })
})
