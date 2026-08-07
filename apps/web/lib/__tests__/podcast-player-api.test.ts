import { describe, expect, test } from 'vitest'

import {
  extractSpotifyUri,
  formatPlaybackTime,
} from '@/app/[locale]/media/_components/podcast-player-api'

describe('extractSpotifyUri', () => {
  test.each([
    'https://open.spotify.com/episode/34Q4YG4bidD4vvPuYJwa0z',
    'https://open.spotify.com/episode/34Q4YG4bidD4vvPuYJwa0z?si=abc&t=45',
    'https://open.spotify.com/intl-ko/episode/34Q4YG4bidD4vvPuYJwa0z',
  ])('maps %s to a Spotify URI', (url) => {
    expect(extractSpotifyUri(url)).toBe('spotify:episode:34Q4YG4bidD4vvPuYJwa0z')
  })

  test('supports show URLs', () => {
    expect(extractSpotifyUri('https://open.spotify.com/show/7vC3Iydlbc')).toBe(
      'spotify:show:7vC3Iydlbc'
    )
  })

  test.each([
    'https://podcasts.apple.com/us/podcast/x/id1?i=2',
    'https://open.spotify.com/episode',
    'https://open.spotify.com/playlist/abc',
    'not a url',
  ])('rejects %s', (url) => {
    expect(extractSpotifyUri(url)).toBeUndefined()
  })
})

describe('formatPlaybackTime', () => {
  test.each([
    [0, '00:00'],
    [-5, '00:00'],
    [Number.NaN, '00:00'],
    [59, '00:59'],
    [3435, '57:15'],
    [3600, '1:00:00'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatPlaybackTime(value)).toBe(expected)
  })
})
