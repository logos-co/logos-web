import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import sharp from 'sharp'

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
const DOWNLOAD_TIMEOUT_MS = 60_000
const DOWNLOAD_ATTEMPTS = 2
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
}

export interface BuildMediaImagesResult {
  manifest: MediaImageManifest
  failures: Array<{ url: string; reason: string }>
  /** Vector or animated files that stay on the CMS. */
  skipped: string[]
}

type ImageOutcome =
  | { kind: 'built'; url: string; entry: MediaImageEntry }
  | { kind: 'skipped'; url: string }
  | { kind: 'failed'; url: string; reason: string }

async function downloadImage(url: string): Promise<Buffer> {
  let lastError: unknown
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      })
      if (!response.ok) throw new Error(`status ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
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

async function readCachedEntry(
  stem: string,
  cacheDir: string
): Promise<MediaImageEntry | null> {
  const metaPath = join(cacheDir, `${stem}.json`)
  if (!existsSync(metaPath)) return null

  const entry = JSON.parse(await readFile(metaPath, 'utf8')) as MediaImageEntry
  const complete = entry.variants.every((variant) =>
    existsSync(join(cacheDir, variant.file))
  )
  return complete ? entry : null
}

async function createVariants(
  source: Buffer,
  stem: string,
  cacheDir: string
): Promise<MediaImageEntry | null> {
  const metadata = await sharp(source).metadata()
  const isAnimated = (metadata.pages ?? 1) > 1
  if (!RESIZABLE_FORMATS.has(metadata.format ?? '') || isAnimated) return null

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
  await writeFile(join(cacheDir, `${stem}.json`), JSON.stringify(entry))
  return entry
}

async function buildOne(
  url: string,
  options: Required<Pick<BuildMediaImagesOptions, 'cacheDir' | 'outputDir'>> & {
    fetchImage: (url: string) => Promise<Buffer>
  }
): Promise<ImageOutcome> {
  const stem = variantStem(url)
  try {
    const entry =
      (await readCachedEntry(stem, options.cacheDir)) ??
      (await createVariants(
        await options.fetchImage(url),
        stem,
        options.cacheDir
      ))
    if (!entry) return { kind: 'skipped', url }

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
    const reason = error instanceof Error ? error.message : String(error)
    return { kind: 'failed', url, reason }
  }
}

async function mapWithConcurrency<T, R>(
  items: ReadonlyArray<T>,
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await task(items[index]!)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
  return results
}

export async function buildMediaImages({
  urls,
  cacheDir,
  outputDir,
  fetchImage = downloadImage,
  concurrency = DEFAULT_CONCURRENCY,
}: BuildMediaImagesOptions): Promise<BuildMediaImagesResult> {
  await rm(outputDir, { recursive: true, force: true })
  await Promise.all([
    mkdir(outputDir, { recursive: true }),
    mkdir(cacheDir, { recursive: true }),
  ])

  const outcomes = await mapWithConcurrency(urls, concurrency, (url) =>
    buildOne(url, { cacheDir, outputDir, fetchImage })
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
  }
}
