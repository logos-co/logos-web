import { existsSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildMediaImages, downloadImage } from '@/lib/media-image-variants'

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

describe('buildMediaImages markers', () => {
  const DAY = 24 * 60 * 60 * 1000
  const url = `${CMS}/stalled.png`

  it('skips a failed URL for a day, then downloads it again', async () => {
    const fetchImage = vi.fn().mockRejectedValue(new Error('no data for 10s'))
    let time = 1_000_000
    const options = {
      urls: [url],
      cacheDir,
      outputDir,
      fetchImage,
      now: () => time,
    }

    const first = await buildMediaImages(options)
    expect(first.failures).toEqual([{ url, reason: 'no data for 10s' }])

    time += DAY - 1
    const second = await buildMediaImages(options)
    expect(fetchImage).toHaveBeenCalledTimes(1)
    expect(second.failures).toEqual([])
    expect(second.marked).toEqual([
      { url, retryAfter: new Date(1_000_000 + DAY).toISOString() },
    ])
    expect(second.manifest).toEqual({})

    time += 1
    fetchImage.mockResolvedValue(await png(800, 400))
    const third = await buildMediaImages(options)
    expect(fetchImage).toHaveBeenCalledTimes(2)
    expect(third.marked).toEqual([])
    expect(third.manifest[url]?.width).toBe(800)
  })

  it('ignores and writes no failure marker when markFailures is off', async () => {
    const fetchImage = vi.fn().mockRejectedValue(new Error('CMS unavailable'))
    const options = {
      urls: [url],
      cacheDir,
      outputDir,
      fetchImage,
      markFailures: false,
    }

    await buildMediaImages(options)
    const second = await buildMediaImages(options)

    expect(fetchImage).toHaveBeenCalledTimes(2)
    expect(second.marked).toEqual([])
    expect(await readdir(cacheDir)).toEqual([])
  })

  it('remembers vector or animated files so they are not downloaded again', async () => {
    const gif = `${CMS}/diagram.svg`
    const fetchImage = vi
      .fn()
      .mockResolvedValue(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
        )
      )
    const options = { urls: [gif], cacheDir, outputDir, fetchImage }

    const first = await buildMediaImages(options)
    const second = await buildMediaImages(options)

    expect(first.skipped).toEqual([gif])
    expect(second.skipped).toEqual([gif])
    expect(fetchImage).toHaveBeenCalledTimes(1)
  })

  it('keeps cached variants when the CMS starts failing', async () => {
    const fetchImage = vi.fn().mockResolvedValue(await png(800, 400))
    const options = { urls: [url], cacheDir, outputDir, fetchImage }
    const built = await buildMediaImages(options)

    fetchImage.mockRejectedValue(new Error('down'))
    const second = await buildMediaImages(options)
    const third = await buildMediaImages(options)

    expect(fetchImage).toHaveBeenCalledTimes(1)
    for (const result of [second, third]) {
      expect(result.manifest).toEqual(built.manifest)
      expect(result.failures).toEqual([])
      expect(result.marked).toEqual([])
    }
    const meta = (await readdir(cacheDir)).find((file) =>
      file.endsWith('.json')
    )!
    expect(JSON.parse(await readFile(join(cacheDir, meta), 'utf8'))).toEqual(
      built.manifest[url]
    )
  })
})

describe('downloadImage', () => {
  let server: Server
  let base: string

  beforeEach(async () => {
    server = createServer((request, response) => {
      if (request.url === '/stall') {
        response.writeHead(200, { 'Content-Type': 'image/gif' })
        response.write('GIF89a')
        return
      }
      if (request.url === '/silent') return
      response.writeHead(200)
      let sent = 0
      const timer = setInterval(() => {
        response.write('x')
        sent += 1
        if (sent === 5) {
          clearInterval(timer)
          response.end()
        }
      }, 20)
    })
    await new Promise<void>((resolve) => server.listen(0, resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterEach(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  it('fails fast when the body stalls after a few bytes', async () => {
    const started = Date.now()
    await expect(
      downloadImage(`${base}/stall`, { idleMs: 100, totalMs: 5000 })
    ).rejects.toThrow('no data for 0.1s')
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('fails fast when no response arrives', async () => {
    await expect(
      downloadImage(`${base}/silent`, { idleMs: 100, totalMs: 5000 })
    ).rejects.toThrow('no data for 0.1s')
  })

  it('keeps a slow but steady download alive past the idle timeout', async () => {
    const body = await downloadImage(`${base}/slow`, {
      idleMs: 60,
      totalMs: 5000,
    })
    expect(body.toString()).toBe('xxxxx')
  })

  it('stops a trickle at the total timeout', async () => {
    await expect(
      downloadImage(`${base}/slow`, { idleMs: 60, totalMs: 50 })
    ).rejects.toThrow('not done after 0.05s')
  })
})
