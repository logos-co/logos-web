import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { readMediaImageManifest } from '@/lib/media-image-manifest'

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'media-manifest-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('readMediaImageManifest', () => {
  it('reads the manifest the asset script wrote', async () => {
    const path = join(root, 'manifest.json')
    const manifest = {
      'https://cms-press.logos.co/uploads/a.png': {
        width: 800,
        height: 600,
        variants: [{ width: 750, file: 'a-1234abcd-750.webp' }],
      },
    }
    await writeFile(path, JSON.stringify(manifest))

    expect(readMediaImageManifest(path)).toEqual(manifest)
  })

  it('falls back to CMS images when no manifest was generated', () => {
    expect(readMediaImageManifest(join(root, 'missing.json'))).toEqual({})
  })

  it('fails loudly on a corrupt manifest', async () => {
    const path = join(root, 'manifest.json')
    await writeFile(path, '{"broken"')

    expect(() => readMediaImageManifest(path)).toThrow()
  })
})
