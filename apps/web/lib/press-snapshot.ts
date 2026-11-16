import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { env } from './env'
import type { BlogArticleDetail, BlogPodcastDetail } from './blog-content'

export interface PressSnapshot {
  version: 1 | 2
  articles: BlogArticleDetail[]
  podcasts: BlogPodcastDetail[]
}

export const readPressSnapshot = async (
  filename: string
): Promise<PressSnapshot> => {
  const value: unknown = JSON.parse(await readFile(filename, 'utf8'))
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    (value.version !== 1 && value.version !== 2) ||
    !('articles' in value) ||
    !Array.isArray(value.articles) ||
    !('podcasts' in value) ||
    !Array.isArray(value.podcasts)
  ) {
    throw new Error(
      'Unsupported press content snapshot; build a new staging preview'
    )
  }
  // The snapshot is an internal build artifact produced by this app, never a browser input.
  const snapshot = value as PressSnapshot
  if (
    env.NEXT_PUBLIC_API_MODE !== 'staging' &&
    (snapshot.version === 2 ||
      [...snapshot.articles, ...snapshot.podcasts].some((post) => post.isDraft))
  ) {
    throw new Error(
      'A snapshot containing drafts is staging-only. Publish reviewed posts and capture a new snapshot before production.'
    )
  }
  return snapshot
}

let snapshot: Promise<PressSnapshot> | undefined

export const getPressSnapshot = (): Promise<PressSnapshot | null> => {
  if (!env.PRESS_CONTENT_SNAPSHOT) return Promise.resolve(null)
  snapshot ??= readPressSnapshot(env.PRESS_CONTENT_SNAPSHOT)
  return snapshot
}

/**
 * Last published media the build fetched from the CMS, committed so a build
 * can still ship /media during a CMS outage (ALLOW_CONTENT_FETCH_FAILURE=1).
 * `scripts/generate-media-assets.ts` rewrites it after every successful fetch.
 */
export const FALLBACK_PRESS_SNAPSHOT_PATH = join(
  process.cwd(),
  'lib',
  'data',
  'press.snapshot.json'
)

let fallbackSnapshot: Promise<PressSnapshot> | undefined

export const getFallbackPressSnapshot = (): Promise<PressSnapshot> => {
  fallbackSnapshot ??= readPressSnapshot(FALLBACK_PRESS_SNAPSHOT_PATH)
  return fallbackSnapshot
}

/**
 * Keeps published posts only, so the file is safe for production builds, and
 * drops the forum replies: they change daily, and the page refreshes them in
 * the browser anyway.
 */
export const toFallbackPressSnapshot = (
  articles: BlogArticleDetail[],
  podcasts: BlogPodcastDetail[]
): PressSnapshot => ({
  version: 1,
  articles: articles
    .filter((article) => !article.isDraft)
    .map(({ discussion: _discussion, ...article }) => article),
  podcasts: podcasts.filter((podcast) => !podcast.isDraft),
})

export const writeFallbackPressSnapshot = async (
  articles: BlogArticleDetail[],
  podcasts: BlogPodcastDetail[]
): Promise<void> => {
  await writeFile(
    FALLBACK_PRESS_SNAPSHOT_PATH,
    `${JSON.stringify(toFallbackPressSnapshot(articles, podcasts), null, 2)}\n`
  )
}
