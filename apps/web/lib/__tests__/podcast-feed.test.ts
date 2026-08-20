import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  clearPodcastAudioCache,
  resolveAudioFromApplePodcasts,
} from '../podcast-feed'

const APPLE_URL =
  'https://podcasts.apple.com/us/podcast/logos-podcast/id1000457699?i=1000669944915'

const EPISODE = {
  wrapperType: 'podcastEpisode',
  trackId: 1000669964475,
  trackName:
    'Federico Ast, Kleros: Decentralised Arbitration System | Logos Podcast with Jarrad Hope',
  episodeUrl: 'https://anchor.fm/s/f97fc444/podcast/play/91880594/episode.mp3',
  trackTimeMillis: 3435000,
}

function mockLookup(results: unknown[], ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    json: async () => ({ results }),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  clearPodcastAudioCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('resolveAudioFromApplePodcasts', () => {
  test('resolves the audio file and duration for a matching episode', async () => {
    mockLookup([{ wrapperType: 'track' }, EPISODE])

    await expect(
      resolveAudioFromApplePodcasts(
        APPLE_URL,
        'Federico Ast, Kleros: Decentralised Arbitration System'
      )
    ).resolves.toEqual({
      audioFileUrl: EPISODE.episodeUrl,
      duration: 3435,
    })
  })

  test('matches on title when the CMS episode id is stale', async () => {
    mockLookup([EPISODE])

    // The URL carries i=1000669944915, Apple has 1000669964475.
    const resolved = await resolveAudioFromApplePodcasts(
      APPLE_URL,
      'Federico Ast, Kleros: Decentralised Arbitration System'
    )

    expect(resolved?.audioFileUrl).toBe(EPISODE.episodeUrl)
  })

  test('prefers the episode id over the title when it matches', async () => {
    mockLookup([
      { ...EPISODE, trackId: 1000669944915, episodeUrl: 'https://a/by-id.mp3' },
      { ...EPISODE, episodeUrl: 'https://a/by-title.mp3' },
    ])

    const resolved = await resolveAudioFromApplePodcasts(APPLE_URL, 'Federico Ast')

    expect(resolved?.audioFileUrl).toBe('https://a/by-id.mp3')
  })

  test('requests the show only once across episodes', async () => {
    const fetchMock = mockLookup([EPISODE])

    await resolveAudioFromApplePodcasts(APPLE_URL, 'Federico Ast')
    await resolveAudioFromApplePodcasts(APPLE_URL, 'Federico Ast')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('returns undefined when no episode matches', async () => {
    mockLookup([EPISODE])

    await expect(
      resolveAudioFromApplePodcasts(APPLE_URL, 'A completely different episode')
    ).resolves.toBeUndefined()
  })

  test('returns undefined for a URL without a show id', async () => {
    const fetchMock = mockLookup([EPISODE])

    await expect(
      resolveAudioFromApplePodcasts(
        'https://podcasts.apple.com/us/podcast/logos-podcast',
        'Federico Ast'
      )
    ).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('degrades to no audio when the lookup fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLookup([], false)

    await expect(
      resolveAudioFromApplePodcasts(APPLE_URL, 'Federico Ast')
    ).resolves.toBeUndefined()
  })

  test('retries after a failed lookup instead of caching the failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLookup([], false)
    await resolveAudioFromApplePodcasts(APPLE_URL, 'Federico Ast')

    const fetchMock = mockLookup([EPISODE])
    const resolved = await resolveAudioFromApplePodcasts(
      APPLE_URL,
      'Federico Ast'
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(resolved?.audioFileUrl).toBe(EPISODE.episodeUrl)
  })
})
