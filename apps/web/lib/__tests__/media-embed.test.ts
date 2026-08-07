import { describe, expect, test } from 'vitest'

import { spotifyEmbedUrl, youtubeEmbedUrl } from '../media-embed'

describe('youtubeEmbedUrl', () => {
  test.each([
    ['https://youtu.be/c8N9Nng5fz0', 'c8N9Nng5fz0'],
    ['https://www.youtube.com/watch?v=33BKS911V6U', '33BKS911V6U'],
    ['https://youtube.com/embed/h0T6uFnsOo4', 'h0T6uFnsOo4'],
    ['https://youtube.com/shorts/h0T6uFnsOo4', 'h0T6uFnsOo4'],
  ])('maps %s to an embeddable URL', (src, id) => {
    expect(youtubeEmbedUrl(src)).toBe(`https://www.youtube.com/embed/${id}`)
  })

  test('rejects non-YouTube URLs', () => {
    expect(youtubeEmbedUrl('https://example.com/video')).toBeUndefined()
  })
})

describe('spotifyEmbedUrl', () => {
  test.each([
    'https://open.spotify.com/episode/34Q4YG4bidD4vvPuYJwa0z',
    'https://open.spotify.com/episode/34Q4YG4bidD4vvPuYJwa0z?si=abc&t=45',
    'https://open.spotify.com/intl-ko/episode/34Q4YG4bidD4vvPuYJwa0z',
  ])('maps %s to an embeddable URL', (src) => {
    expect(spotifyEmbedUrl(src)).toBe(
      'https://open.spotify.com/embed/episode/34Q4YG4bidD4vvPuYJwa0z'
    )
  })

  test('supports show URLs', () => {
    expect(spotifyEmbedUrl('https://open.spotify.com/show/7vC3Iydlbc')).toBe(
      'https://open.spotify.com/embed/show/7vC3Iydlbc'
    )
  })

  test.each([
    'https://podcasts.apple.com/us/podcast/x/id1?i=2',
    'https://open.spotify.com/episode',
    'https://example.com/episode/abc',
    'not a url',
  ])('rejects %s', (src) => {
    expect(spotifyEmbedUrl(src)).toBeUndefined()
  })
})
