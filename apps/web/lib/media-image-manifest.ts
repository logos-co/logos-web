import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BlogArticleDetail, BlogPodcastDetail } from '@/lib/blog-content'
import { env } from '@/lib/env'
import {
  MEDIA_IMAGE_DIR,
  withOptimizedMediaImages,
  type MediaImageManifest,
} from '@/lib/media-images'

/** Written by scripts/generate-media-assets.ts before `next build`. */
export const MEDIA_IMAGE_MANIFEST_PATH = join(
  process.cwd(),
  '.media-images',
  'manifest.json'
)
export const MEDIA_IMAGE_OUTPUT_DIR = join(
  process.cwd(),
  'public',
  MEDIA_IMAGE_DIR
)
/** Next keeps .next/cache between builds, so unchanged uploads are reused. */
export const MEDIA_IMAGE_CACHE_DIR = join(
  process.cwd(),
  '.next',
  'cache',
  MEDIA_IMAGE_DIR
)

/**
 * A plain `next dev` has no manifest, so the pages keep the CMS images. A
 * manifest that exists but does not parse is a broken build and must fail.
 */
export function readMediaImageManifest(
  path = MEDIA_IMAGE_MANIFEST_PATH
): MediaImageManifest {
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
  return JSON.parse(raw) as MediaImageManifest
}

export function withLocalMediaImages<
  T extends BlogArticleDetail | BlogPodcastDetail,
>(post: T): T {
  return withOptimizedMediaImages(
    post,
    readMediaImageManifest(),
    env.BASE_PATH ?? ''
  )
}
