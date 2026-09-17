import { describe, expect, it } from 'vitest'

import type {
  BlogArticleDetail,
  BlogImage,
  BlogPodcastDetail,
} from '@/lib/blog-content'
import {
  collectMediaImageUrls,
  optimizeHtmlImages,
  optimizeMediaImage,
  withOptimizedMediaImages,
  type MediaImageManifest,
} from '@/lib/media-images'

const CMS = 'https://cms-press.logos.co/uploads'
const COVER = `${CMS}/cover_abc.png`
const PHOTO = `${CMS}/photo_def.png`
const SMALL = `${CMS}/small_ghi.png`

const manifest: MediaImageManifest = {
  [COVER]: {
    width: 1200,
    height: 630,
    variants: [
      { width: 750, file: 'cover_abc-1a2b3c4d-750.webp' },
      { width: 1200, file: 'cover_abc-1a2b3c4d-1200.webp' },
    ],
  },
  [PHOTO]: {
    width: 2160,
    height: 2160,
    variants: [
      { width: 750, file: 'photo_def-5e6f7a8b-750.webp' },
      { width: 1400, file: 'photo_def-5e6f7a8b-1400.webp' },
    ],
  },
  [SMALL]: {
    width: 600,
    height: 400,
    variants: [{ width: 600, file: 'small_ghi-9c0d1e2f-600.webp' }],
  },
}

const image = (url: string): BlogImage => ({
  url,
  alt: 'Alt text',
  width: 0,
  height: 0,
  caption: 'Caption',
})

const article = (overrides: Partial<BlogArticleDetail> = {}) =>
  ({
    type: 'article',
    id: '135',
    slug: 'june-2026',
    title: 'June',
    coverImage: image(COVER),
    ogImage: image(COVER),
    bodyHtml: `<figure class="image"><img src="${PHOTO}" alt="Photo"></figure>`,
    ...overrides,
  }) as BlogArticleDetail

describe('optimizeMediaImage', () => {
  it('points at the smallest variant and lists every width', () => {
    expect(optimizeMediaImage(image(COVER), manifest)).toEqual({
      url: '/media-images/cover_abc-1a2b3c4d-750.webp',
      srcSet:
        '/media-images/cover_abc-1a2b3c4d-750.webp 750w, /media-images/cover_abc-1a2b3c4d-1200.webp 1200w',
      alt: 'Alt text',
      width: 1200,
      height: 630,
      caption: 'Caption',
    })
  })

  it('prefixes the base path the site is served under', () => {
    expect(optimizeMediaImage(image(SMALL), manifest, '/logos')).toMatchObject({
      url: '/logos/media-images/small_ghi-9c0d1e2f-600.webp',
      srcSet: '/logos/media-images/small_ghi-9c0d1e2f-600.webp 600w',
    })
  })

  it('leaves images without variants untouched', () => {
    const remote = image(`${CMS}/animated.gif`)

    expect(optimizeMediaImage(remote, manifest)).toBe(remote)
    expect(optimizeMediaImage(null, manifest)).toBeNull()
  })
})

describe('optimizeHtmlImages', () => {
  it('rewrites CMS images to responsive local variants', () => {
    const html = `<p>Intro</p><figure class="image"><img style="aspect-ratio:1" src="${PHOTO}" srcset="${CMS}/large_photo_def.png 1000w" sizes="100vw" width="2160" height="2160" alt="Photo"></figure>`

    expect(optimizeHtmlImages(html, manifest)).toBe(
      '<p>Intro</p><figure class="image"><img style="aspect-ratio:1" alt="Photo" src="/media-images/photo_def-5e6f7a8b-750.webp" srcset="/media-images/photo_def-5e6f7a8b-750.webp 750w, /media-images/photo_def-5e6f7a8b-1400.webp 1400w" sizes="(max-width: 767px) calc(100vw - 32px), 700px" width="2160" height="2160" loading="lazy" decoding="async"></figure>'
    )
  })

  it('matches uploads saved under another CMS host', () => {
    const html = `<img src='https://lpe-cms-production.up.railway.app/uploads/photo_def.png' alt="Photo" />`

    expect(optimizeHtmlImages(html, manifest)).toContain(
      'src="/media-images/photo_def-5e6f7a8b-750.webp"'
    )
  })

  it('points relative and stale-host uploads without variants at the CMS', () => {
    const html =
      '<img src="/uploads/diagram.svg" alt="Diagram"><img src="http://localhost:1337/uploads/chart.gif">'

    expect(optimizeHtmlImages(html, manifest)).toBe(
      `<img alt="Diagram" src="${CMS}/diagram.svg"><img src="${CMS}/chart.gif">`
    )
  })

  it('keeps images from other sites as they are', () => {
    const html = '<img src="https://img.youtube.com/vi/abc/0.jpg" alt="Video">'

    expect(optimizeHtmlImages(html, manifest)).toBe(html)
  })
})

describe('collectMediaImageUrls', () => {
  it('gathers cover, block and inline images once each', () => {
    const post = article({
      content: [
        { ...image(PHOTO), type: 'image', order: 1, labels: [] },
        {
          type: 'text',
          order: 2,
          tagName: 'p',
          html: `<img src="/uploads/small_ghi.png">`,
          text: '',
          labels: [],
        },
      ],
      blocks: [
        { type: 'rich-text', body: `<img src="${COVER}">` },
        {
          type: 'interactive-embed',
          html: `<img src="${CMS}/inside_embed.png">`,
        },
      ],
    })

    expect(collectMediaImageUrls(post).sort()).toEqual(
      [COVER, PHOTO, SMALL].sort()
    )
  })

  it('skips the share image and images hosted elsewhere', () => {
    const post = article({
      coverImage: image('https://img.youtube.com/vi/abc/0.jpg'),
      ogImage: image(`${CMS}/og_only.png`),
      bodyHtml: undefined,
    })

    expect(collectMediaImageUrls(post)).toEqual([])
  })
})

describe('withOptimizedMediaImages', () => {
  it('returns a new article with local images and leaves the input alone', () => {
    const original = article({
      content: [{ ...image(PHOTO), type: 'image', order: 1, labels: [] }],
      blocks: [{ type: 'rich-text', body: `<img src="${SMALL}">` }],
    })
    const snapshot = structuredClone(original)

    const optimized = withOptimizedMediaImages(original, manifest)

    expect(original).toEqual(snapshot)
    expect(optimized.coverImage?.url).toBe(
      '/media-images/cover_abc-1a2b3c4d-750.webp'
    )
    expect(optimized.ogImage).toBe(original.ogImage)
    expect(optimized.bodyHtml).toContain('photo_def-5e6f7a8b-1400.webp 1400w')
    expect(optimized.content?.[0]).toMatchObject({
      type: 'image',
      url: '/media-images/photo_def-5e6f7a8b-750.webp',
      width: 2160,
    })
    expect(optimized.blocks?.[0]).toEqual({
      type: 'rich-text',
      body: expect.stringContaining('small_ghi-9c0d1e2f-600.webp'),
    })
  })

  it('optimizes podcast and related episode covers', () => {
    const podcast = {
      type: 'podcast',
      slug: 'episode',
      showSlug: 'logos-state',
      coverImage: image(COVER),
      relatedEpisodes: [{ type: 'podcast', coverImage: image(SMALL) }],
    } as unknown as BlogPodcastDetail

    const optimized = withOptimizedMediaImages(podcast, manifest)

    expect(optimized.coverImage?.srcSet).toContain('1200w')
    expect(optimized.relatedEpisodes[0]?.coverImage?.url).toBe(
      '/media-images/small_ghi-9c0d1e2f-600.webp'
    )
  })
})
