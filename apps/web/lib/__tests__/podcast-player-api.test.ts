import { describe, expect, test } from 'vitest'

import {
  extractSpotifyUri,
  extractYoutubeVideoId,
  formatPlaybackTime,
} from '@/app/[locale]/media/_components/podcast-player-api'

describe('extractSpotifyUri', () => {
  test.each([
    'https://open.spotify.com/episode/34Q4YG4bidD4vvPuYJwa0z',
    'https://open.spotify.com/episode/34Q4YG4bidD4vvPuYJwa0z?si=abc&t=45',
    'https://open.spotify.com/intl-ko/episode/34Q4YG4bidD4vvPuYJwa0z',
  ])('maps %s to a Spotify URI', (url) => {
    expect(extractSpotifyUri(url)).toBe(
      'spotify:episode:34Q4YG4bidD4vvPuYJwa0z'
    )
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

describe('extractYoutubeVideoId', () => {
  test.each([
    'https://youtu.be/GgV113__FJA',
    'https://www.youtube.com/watch?v=GgV113__FJA&t=30',
    'https://www.youtube.com/embed/GgV113__FJA',
    'https://youtube.com/shorts/GgV113__FJA',
    '  https://youtu.be/GgV113__FJA  ',
  ])('reads the video id from %s', (url) => {
    expect(extractYoutubeVideoId(url)).toBe('GgV113__FJA')
  })

  test('uses the first link when the CMS field holds several', () => {
    // The Stella Assange episode stores its YouTube, Google and Apple links in
    // one field; the URL parser would glue them into one bogus id.
    const field =
      'https://youtu.be/GgV113__FJA\nhttps://podcasts.google.com?feed=abc\nhttps://podcasts.apple.com/us/podcast/x/id1?i=2'

    expect(extractYoutubeVideoId(field)).toBe('GgV113__FJA')
  })

  test.each([
    'https://youtu.be/',
    'https://youtu.be/not-a-valid-id-at-all',
    'https://www.youtube.com/channel/UC123',
    'https://vimeo.com/123',
    'not a url',
    '',
  ])('rejects %s', (url) => {
    expect(extractYoutubeVideoId(url)).toBeUndefined()
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
