import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import sharp from 'sharp'

import { mapWithConcurrency } from '@/lib/concurrency'
import {
  MEDIA_IMAGE_WIDTHS,
  type MediaImageEntry,
  type MediaImageManifest,
} from '@/lib/media-images'

/**
 * Build-time only: downloads CMS images and writes the resized WebP copies
 * the media pages serve. Imported by scripts/generate-media-assets.ts, never
 * by app code.
 */

const WEBP_QUALITY = 78
const DEFAULT_CONCURRENCY = 6
/**
 * Healthy CMS downloads start in well under a second, so 10s without a byte
 * means the server has stalled (some uploads send a few header bytes, then
 * nothing). The total cap only stops a trickle; large files still finish.
 * No retry: a second attempt on a stalled server only doubles the wait.
 */
const DOWNLOAD_IDLE_TIMEOUT_MS = 10_000
const DOWNLOAD_TOTAL_TIMEOUT_MS = 60_000
/** A failed URL is not downloaded again until this long after the failure. */
const FAILURE_RETRY_MS = 24 * 60 * 60 * 1000
/** Formats sharp can resize without losing animation or vector sharpness. */
const RESIZABLE_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'tiff'])

export interface BuildMediaImagesOptions {
  urls: ReadonlyArray<string>
  /** Kept between builds so unchanged uploads are not fetched again. */
  cacheDir: string
  /** Emptied, then filled with the variants this build uses. */
  outputDir: string
  fetchImage?: (url: string) => Promise<Buffer>
  concurrency?: number
  /**
   * Remember failed downloads in the cache so the next builds skip them for
   * a day. Off for local fixtures and CMS outages, where a failure says
   * nothing about the upload itself.
   */
  markFailures?: boolean
  now?: () => number
}

export interface BuildMediaImagesResult {
  manifest: MediaImageManifest
  failures: Array<{ url: string; reason: string }>
  /** Vector or animated files that stay on the CMS. */
  skipped: string[]
  /** Failed in an earlier build, not downloaded again until `retryAfter`. */
  marked: Array<{ url: string; retryAfter: string }>
}

type ImageOutcome =
  | { kind: 'built'; url: string; entry: MediaImageEntry }
  | { kind: 'skipped'; url: string }
  | { kind: 'failed'; url: string; reason: string }
  | { kind: 'marked'; url: string; retryAfter: string }

/** What `<stem>.json` in the cache holds besides a built entry. */
interface SkippedMarker {
  skipped: true
}
interface FailureMarker {
  failedAt: number
  reason: string
}
type CacheRecord = MediaImageEntry | SkippedMarker | FailureMarker

export interface DownloadTimeouts {
  idleMs: number
  totalMs: number
}

export async function downloadImage(
  url: string,
  {
    idleMs = DOWNLOAD_IDLE_TIMEOUT_MS,
    totalMs = DOWNLOAD_TOTAL_TIMEOUT_MS,
  }: Partial<DownloadTimeouts> = {}
): Promise<Buffer> {
  const controller = new AbortController()
  let idleTimer: NodeJS.Timeout | undefined
  const resetIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(
      () => controller.abort(new Error(`no data for ${idleMs / 1000}s`)),
      idleMs
    )
  }
  const totalTimer = setTimeout(
    () => controller.abort(new Error(`not done after ${totalMs / 1000}s`)),
    totalMs
  )

  try {
    resetIdle()
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`status ${response.status}`)
    }
    if (!response.body) throw new Error('empty response')

    const chunks: Uint8Array[] = []
    const reader = response.body.getReader()
    for (;;) {
      resetIdle()
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    return Buffer.concat(chunks)
  } catch (error) {
    const reason = controller.signal.aborted ? controller.signal.reason : error
    // Release the socket of a body that was not read to the end.
    controller.abort(reason)
    throw reason
  } finally {
    clearTimeout(idleTimer)
    clearTimeout(totalTimer)
  }
}

/** Stable per URL: the readable CMS name plus a hash of the full URL. */
function variantStem(url: string): string {
  const name = basename(new URL(url).pathname, extname(new URL(url).pathname))
  const readable = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 8)
  return `${readable}-${hash}`
}

function targetWidths(sourceWidth: number): number[] {
  const widths = MEDIA_IMAGE_WIDTHS.map((width) => Math.min(width, sourceWidth))
  return [...new Set(widths)].sort((a, b) => a - b)
}

async function readCacheRecord(
  stem: string,
  cacheDir: string
): Promise<CacheRecord | null> {
  const metaPath = join(cacheDir, `${stem}.json`)
  if (!existsSync(metaPath)) return null

  const record = JSON.parse(await readFile(metaPath, 'utf8')) as CacheRecord
  if (!('variants' in record)) return record
  const complete = record.variants.every((variant) =>
    existsSync(join(cacheDir, variant.file))
  )
  return complete ? record : null
}

const writeCacheRecord = (
  stem: string,
  cacheDir: string,
  record: CacheRecord
): Promise<void> =>
  writeFile(join(cacheDir, `${stem}.json`), JSON.stringify(record))

async function createVariants(
  source: Buffer,
  stem: string,
  cacheDir: string
): Promise<MediaImageEntry | null> {
  const metadata = await sharp(source).metadata()
  const isAnimated = (metadata.pages ?? 1) > 1
  if (!RESIZABLE_FORMATS.has(metadata.format ?? '') || isAnimated) {
    await writeCacheRecord(stem, cacheDir, { skipped: true })
    return null
  }

  const { width, height } = metadata.autoOrient
  const variants = await Promise.all(
    targetWidths(width).map(async (target) => {
      const file = `${stem}-${target}.webp`
      await sharp(source)
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(join(cacheDir, file))
      return { width: target, file }
    })
  )
  const entry: MediaImageEntry = { width, height, variants }
  await writeCacheRecord(stem, cacheDir, entry)
  return entry
}

type BuildOneOptions = Required<
  Pick<
    BuildMediaImagesOptions,
    'cacheDir' | 'outputDir' | 'fetchImage' | 'markFailures' | 'now'
  >
>

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/** Cached variants first, then the markers, then a download. */
async function resolveEntry(
  url: string,
  stem: string,
  options: BuildOneOptions
): Promise<Exclude<ImageOutcome, { kind: 'built' }> | MediaImageEntry> {
  const cached = await readCacheRecord(stem, options.cacheDir)
  if (cached && 'variants' in cached) return cached
  if (cached && 'skipped' in cached) return { kind: 'skipped', url }
  if (cached && 'failedAt' in cached && options.markFailures) {
    const retryAt = cached.failedAt + FAILURE_RETRY_MS
    if (options.now() < retryAt) {
      return {
        kind: 'marked',
        url,
        retryAfter: new Date(retryAt).toISOString(),
      }
    }
  }

  // An upload sharp cannot decode fails the same way on every build.
  try {
    const source = await options.fetchImage(url)
    return (
      (await createVariants(source, stem, options.cacheDir)) ?? {
        kind: 'skipped',
        url,
      }
    )
  } catch (error) {
    const reason = errorMessage(error)
    if (options.markFailures) {
      await writeCacheRecord(stem, options.cacheDir, {
        failedAt: options.now(),
        reason,
      })
    }
    return { kind: 'failed', url, reason }
  }
}

async function buildOne(
  url: string,
  options: BuildOneOptions
): Promise<ImageOutcome> {
  try {
    const entry = await resolveEntry(url, variantStem(url), options)
    if ('kind' in entry) return entry

    await Promise.all(
      entry.variants.map((variant) =>
        copyFile(
          join(options.cacheDir, variant.file),
          join(options.outputDir, variant.file)
        )
      )
    )
    return { kind: 'built', url, entry }
  } catch (error) {
    return { kind: 'failed', url, reason: errorMessage(error) }
  }
}

export async function buildMediaImages({
  urls,
  cacheDir,
  outputDir,
  fetchImage = downloadImage,
  concurrency = DEFAULT_CONCURRENCY,
  markFailures = true,
  now = Date.now,
}: BuildMediaImagesOptions): Promise<BuildMediaImagesResult> {
  await rm(outputDir, { recursive: true, force: true })
  await Promise.all([
    mkdir(outputDir, { recursive: true }),
    mkdir(cacheDir, { recursive: true }),
  ])

  const outcomes = await mapWithConcurrency(urls, concurrency, (url) =>
    buildOne(url, { cacheDir, outputDir, fetchImage, markFailures, now })
  )

  return {
    manifest: Object.fromEntries(
      outcomes.flatMap((outcome) =>
        outcome.kind === 'built' ? [[outcome.url, outcome.entry]] : []
      )
    ),
    failures: outcomes.flatMap((outcome) =>
      outcome.kind === 'failed'
        ? [{ url: outcome.url, reason: outcome.reason }]
        : []
    ),
    skipped: outcomes.flatMap((outcome) =>
      outcome.kind === 'skipped' ? [outcome.url] : []
    ),
    marked: outcomes.flatMap((outcome) =>
      outcome.kind === 'marked'
        ? [{ url: outcome.url, retryAfter: outcome.retryAfter }]
        : []
    ),
  }
}
