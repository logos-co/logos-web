import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPressPreviewSlugs, isPressPreviewArticle } from '../press-preview'
import { readPressSnapshot } from '../press-snapshot'

const { envStub } = vi.hoisted(() => ({
  envStub: { NEXT_PUBLIC_API_MODE: 'staging' },
}))
vi.mock('@/lib/env', () => ({ env: envStub }))
afterEach(() => {
  envStub.NEXT_PUBLIC_API_MODE = 'staging'
})

describe('public staging article previews', () => {
  it('allows only the selected Waku slugs on staging', () => {
    expect(getPressPreviewSlugs()).toHaveLength(18)
    expect(
      isPressPreviewArticle({ slug: 'waku-roadmap', publishedAt: '2023-11-17' })
    ).toBe(true)
    expect(
      isPressPreviewArticle({
        slug: 'unrelated-draft',
        publishedAt: '2023-11-17',
      })
    ).toBe(false)
  })
  it('never enables draft queries in production or local development', () => {
    for (const mode of ['production', 'development']) {
      envStub.NEXT_PUBLIC_API_MODE = mode
      expect(getPressPreviewSlugs()).toEqual([])
    }
  })
  it('blocks promotion of a snapshot containing draft content', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'press-preview-'))
    const path = join(directory, 'snapshot.json')
    try {
      await writeFile(
        path,
        JSON.stringify({
          version: 2,
          articles: [{ slug: 'waku-roadmap', isDraft: true }],
          podcasts: [],
        })
      )
      await expect(readPressSnapshot(path)).resolves.toMatchObject({
        articles: [{ isDraft: true }],
      })
      envStub.NEXT_PUBLIC_API_MODE = 'production'
      await expect(readPressSnapshot(path)).rejects.toThrow('staging-only')
      await writeFile(
        path,
        JSON.stringify({
          version: 1,
          articles: [{ isDraft: false }],
          podcasts: [],
        })
      )
      await expect(readPressSnapshot(path)).resolves.toMatchObject({
        articles: [{ isDraft: false }],
      })
    } finally {
      await rm(directory, { recursive: true })
    }
  })
})
