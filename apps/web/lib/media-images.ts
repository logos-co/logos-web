import {
  CMS_PRESS_ORIGIN,
  resolveAssetUrl,
  type BlogArticleDetail,
  type BlogContentBlock,
  type BlogDynamicBlock,
  type BlogImage,
  type BlogPodcastDetail,
} from '@/lib/blog-content'
import { env } from '@/lib/env'
import { MEDIA_BODY_IMAGE_SIZES } from '@/lib/media-image-sizes'

/**
 * The static export serves CMS images as uploaded, often 1-2 MB PNGs for a
 * 700px column. scripts/generate-media-assets.ts writes resized WebP copies
 * under public/media-images and a manifest keyed by the CMS URL; these
 * helpers point the media pages at those copies.
 */

export const MEDIA_IMAGE_DIR = 'media-images'
/** One copy for phones, one for retina desktops at the 700px column. */
export const MEDIA_IMAGE_WIDTHS = [750, 1400] as const

export interface MediaImageVariant {
  width: number
  /** File name inside public/media-images. */
  file: string
}

export interface MediaImageEntry {
  width: number
  height: number
  /** Narrowest first. */
  variants: ReadonlyArray<MediaImageVariant>
}

export type MediaImageManifest = Readonly<Record<string, MediaImageEntry>>

type MediaPost = BlogArticleDetail | BlogPodcastDetail

const UPLOADS_PATH = '/uploads/'
const IMG_TAG_PATTERN = /<img\b[^>]*>/gi
/** Hosts the legacy blog CMS has saved upload URLs under. */
const LEGACY_CMS_HOSTS = [
  new URL(CMS_PRESS_ORIGIN).host,
  'lpe-cms-production.up.railway.app',
]
const RESPONSIVE_ATTRIBUTES = [
  'src',
  'srcset',
  'sizes',
  'width',
  'height',
  'loading',
  'decoding',
]

function isCmsHost(url: URL): boolean {
  const assetBase = env.NEXT_PUBLIC_ASSETS_BASE_URL
  const hosts = assetBase
    ? [...LEGACY_CMS_HOSTS, new URL(assetBase).host]
    : LEGACY_CMS_HOSTS
  return hosts.includes(url.host) || url.hostname === 'localhost'
}

/**
 * Canonical CMS URL for an upload, or null for anything else. Editors'
 * bodies can carry relative paths or an old CMS host, so only the path after
 * the host identifies the file.
 */
export function cmsUploadUrl(src: string): string | null {
  if (src.startsWith(UPLOADS_PATH)) return resolveAssetUrl(src)

  let url: URL
  try {
    url = new URL(src)
  } catch {
    return null
  }
  if (!url.pathname.startsWith(UPLOADS_PATH) || !isCmsHost(url)) return null

  return resolveAssetUrl(url.pathname)
}

const variantUrl = (variant: MediaImageVariant, basePath: string): string =>
  `${basePath}/${MEDIA_IMAGE_DIR}/${variant.file}`

const variantSrcSet = (entry: MediaImageEntry, basePath: string): string =>
  entry.variants
    .map((variant) => `${variantUrl(variant, basePath)} ${variant.width}w`)
    .join(', ')

function manifestEntry(
  src: string,
  manifest: MediaImageManifest
): MediaImageEntry | undefined {
  const url = cmsUploadUrl(src)
  const entry = url ? manifest[url] : undefined
  return entry && entry.variants.length > 0 ? entry : undefined
}

export function optimizeMediaImage<T extends BlogImage>(
  image: T | null | undefined,
  manifest: MediaImageManifest,
  basePath = ''
): T | null | undefined {
  const entry = image ? manifestEntry(image.url, manifest) : undefined
  if (!image || !entry) return image

  return {
    ...image,
    url: variantUrl(entry.variants[0]!, basePath),
    srcSet: variantSrcSet(entry, basePath),
    width: entry.width,
    height: entry.height,
  }
}

const decodeAttribute = (value: string): string =>
  value.replaceAll('&amp;', '&')

const attributePattern = (name: string): RegExp =>
  new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'gi')

function readAttribute(tag: string, name: string): string | undefined {
  const match = attributePattern(name).exec(tag)
  if (!match) return undefined
  return decodeAttribute(match[1] ?? match[2] ?? match[3] ?? '')
}

function rewriteImageTag(
  tag: string,
  manifest: MediaImageManifest,
  basePath: string
): string {
  const src = readAttribute(tag, 'src')
  const cmsUrl = src ? cmsUploadUrl(src) : null
  if (!src || !cmsUrl) return tag

  const entry = manifestEntry(cmsUrl, manifest)
  if (!entry && cmsUrl === src) return tag

  const replaced = entry ? RESPONSIVE_ATTRIBUTES : ['src']
  const isSelfClosing = /\/\s*>$/.test(tag)
  const kept = replaced.reduce(
    (current, name) => current.replace(attributePattern(name), ''),
    tag.replace(/\s*\/?\s*>$/, '')
  )
  const added = entry
    ? [
        `src="${variantUrl(entry.variants[0]!, basePath)}"`,
        `srcset="${variantSrcSet(entry, basePath)}"`,
        `sizes="${MEDIA_BODY_IMAGE_SIZES}"`,
        `width="${entry.width}"`,
        `height="${entry.height}"`,
        'loading="lazy"',
        'decoding="async"',
      ]
    : [`src="${cmsUrl}"`]

  return `${kept} ${added.join(' ')}${isSelfClosing ? ' />' : '>'}`
}

export function optimizeHtmlImages(
  html: string,
  manifest: MediaImageManifest,
  basePath = ''
): string {
  return html.replace(IMG_TAG_PATTERN, (tag) =>
    rewriteImageTag(tag, manifest, basePath)
  )
}

function htmlImageSources(html: string | undefined): string[] {
  if (!html) return []
  return (html.match(IMG_TAG_PATTERN) ?? []).flatMap((tag) => {
    const src = readAttribute(tag, 'src')
    return src ? [src] : []
  })
}

function contentImageSources(block: BlogContentBlock): string[] {
  return block.type === 'image' ? [block.url] : htmlImageSources(block.html)
}

function dynamicImageSources(block: BlogDynamicBlock): string[] {
  // Interactive embeds are self-contained documents; leave them alone.
  return block.type === 'rich-text' ? htmlImageSources(block.body) : []
}

/**
 * Every CMS image a detail page shows in its layout. The share image is left
 * out: crawlers fetch it from the CMS directly.
 */
export function collectMediaImageUrls(post: MediaPost): string[] {
  const sources = [
    ...(post.coverImage ? [post.coverImage.url] : []),
    ...(post.content ?? []).flatMap(contentImageSources),
    ...htmlImageSources(post.bodyHtml),
    ...(post.blocks ?? []).flatMap(dynamicImageSources),
  ]
  const urls = sources.flatMap((src) => {
    const url = cmsUploadUrl(src)
    return url ? [url] : []
  })
  return [...new Set(urls)]
}

function optimizeContentBlock(
  block: BlogContentBlock,
  manifest: MediaImageManifest,
  basePath: string
): BlogContentBlock {
  if (block.type === 'image') {
    return optimizeMediaImage(block, manifest, basePath) ?? block
  }
  return { ...block, html: optimizeHtmlImages(block.html, manifest, basePath) }
}

function optimizeDynamicBlock(
  block: BlogDynamicBlock,
  manifest: MediaImageManifest,
  basePath: string
): BlogDynamicBlock {
  if (block.type !== 'rich-text') return block
  return { ...block, body: optimizeHtmlImages(block.body, manifest, basePath) }
}

/** Returns a copy of the post whose layout images point at local variants. */
export function withOptimizedMediaImages<T extends MediaPost>(
  post: T,
  manifest: MediaImageManifest,
  basePath = ''
): T {
  const optimized = {
    ...post,
    coverImage: optimizeMediaImage(post.coverImage, manifest, basePath),
    bodyHtml:
      post.bodyHtml === undefined
        ? undefined
        : optimizeHtmlImages(post.bodyHtml, manifest, basePath),
    content: post.content?.map((block) =>
      optimizeContentBlock(block, manifest, basePath)
    ),
    blocks: post.blocks?.map((block) =>
      optimizeDynamicBlock(block, manifest, basePath)
    ),
  }

  if (post.type !== 'podcast') return optimized as T

  return {
    ...optimized,
    relatedEpisodes: post.relatedEpisodes.map((episode) => ({
      ...episode,
      coverImage: optimizeMediaImage(episode.coverImage, manifest, basePath),
    })),
  } as T
}
