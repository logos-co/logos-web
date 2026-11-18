import { createHash } from 'node:crypto'

/**
 * Bump when the render width, the encoder settings, the output format,
 * `scripts/zines/page-layout.ts` or `scripts/zines/pdf-options.ts` change.
 */
export const ZINE_GENERATOR_VERSION = 2

export const ZINE_PAGE_FILES = (number: number): string[] => [
  `${number}.avif`,
  `${number}-thumb.avif`,
]

export function zineCacheKey(
  source: Uint8Array,
  textLayer: string | null
): string {
  const hash = createHash('sha256')
  hash.update(`generator:${ZINE_GENERATOR_VERSION}\n`)
  hash.update(createHash('sha256').update(source).digest('hex'))
  hash.update('\ntext-layer:')
  if (textLayer !== null)
    hash.update(createHash('sha256').update(textLayer).digest('hex'))
  return hash.digest('hex')
}
