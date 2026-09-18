import { existsSync } from 'node:fs'
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildMediaImages } from '@/lib/media-image-variants'

const CMS = 'https://cms-press.logos.co/uploads'

const png = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: '#336699' },
  })
    .png()
    .toBuffer()

let root: string
let cacheDir: string
let outputDir: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'media-images-'))
  cacheDir = join(root, 'cache')
  outputDir = join(root, 'public', 'media-images')
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('buildMediaImages', () => {
  it('writes a phone and a retina WebP for a wide image', async () => {
    const url = `${CMS}/wide_photo_ab12.png`
    const fetchImage = vi.fn().mockResolvedValue(await png(2000, 1000))

    const { manifest, failures } = await buildMediaImages({
      urls: [url],
      cacheDir,
      outputDir,
      fetchImage,
    })

    expect(failures).toEqual([])
    const entry = manifest[url]!
    expect(entry.width).toBe(2000)
    expect(entry.height).toBe(1000)
    expect(entry.variants.map((variant) => variant.width)).toEqual([750, 1400])
    for (const variant of entry.variants) {
      expect(variant.file).toMatch(/^wide_photo_ab12-[0-9a-f]{8}-\d+\.webp$/)
      const meta = await sharp(join(outputDir, variant.file)).metadata()
      expect(meta.format).toBe('webp')
      expect(meta.width).toBe(variant.width)
    }
  })

  it('never upscales a narrow image', async () => {
    const url = `${CMS}/narrow.png`

    const { manifest } = await buildMediaImages({
      urls: [url],
      cacheDir,
      outputDir,
      fetchImage: async () => png(600, 300),
    })

    expect(manifest[url]?.variants.map((variant) => variant.width)).toEqual([
      600,
    ])
  })

  it('reuses cached variants instead of downloading again', async () => {
    const url = `${CMS}/cached.png`
    const fetchImage = vi.fn().mockResolvedValue(await png(1000, 500))
    const options = { urls: [url], cacheDir, outputDir, fetchImage }

    const first = await buildMediaImages(options)
    const second = await buildMediaImages(options)

    expect(fetchImage).toHaveBeenCalledTimes(1)
    expect(second.manifest).toEqual(first.manifest)
    expect(await readdir(outputDir)).toHaveLength(2)
  })

  it('reports downloads that fail and skips files it cannot resize', async () => {
    const broken = `${CMS}/broken.png`
    const vector = `${CMS}/diagram.svg`
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'
    )

    const result = await buildMediaImages({
      urls: [broken, vector],
      cacheDir,
      outputDir,
      fetchImage: async (url) => {
        if (url === broken) throw new Error('status 502')
        return svg
      },
    })

    expect(result.manifest).toEqual({})
    expect(result.failures).toEqual([{ url: broken, reason: 'status 502' }])
    expect(result.skipped).toEqual([vector])
  })

  it('clears variants left over from an earlier build', async () => {
    await buildMediaImages({ urls: [], cacheDir, outputDir })
    const stale = join(outputDir, 'removed-post-750.webp')
    await writeFile(stale, 'stale')

    await buildMediaImages({ urls: [], cacheDir, outputDir })

    expect(existsSync(stale)).toBe(false)
    expect(existsSync(outputDir)).toBe(true)
  })
})
