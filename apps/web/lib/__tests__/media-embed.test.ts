import { describe, expect, test } from 'vitest'

import { youtubeEmbedUrl } from '../media-embed'

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
