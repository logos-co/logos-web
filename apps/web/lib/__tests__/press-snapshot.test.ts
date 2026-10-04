import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  PRESS_CONTENT_SNAPSHOT: undefined as string | undefined,
}))
vi.mock('@/lib/env', () => ({ env: state }))

let directory: string | undefined
afterEach(async () => {
  vi.unstubAllGlobals()
  vi.resetModules()
  state.PRESS_CONTENT_SNAPSHOT = undefined
  if (directory) await rm(directory, { recursive: true, force: true })
})

describe('reviewed press content', () => {
  it('uses the reviewed slugs, article HTML, podcasts and listings without fetching current CMS data', async () => {
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    state.PRESS_CONTENT_SNAPSHOT = join(directory, 'press.json')
    const article = {
      slug: 'reviewed',
      title: 'Reviewed title',
      bodyHtml: '<p>Reviewed text</p>',
    }
    const podcast = {
      showSlug: 'logos-state',
      slug: 'episode',
      title: 'Reviewed episode',
    }
    await writeFile(
      state.PRESS_CONTENT_SNAPSHOT,
      JSON.stringify({ version: 1, articles: [article], podcasts: [podcast] })
    )
    const network = vi.fn(() => {
      throw new Error('Must not fetch changed CMS content')
    })
    vi.stubGlobal('fetch', network)
    const content = await import('../blog-content')
    expect(await content.getBlogArticleSlugs()).toEqual(['reviewed'])
    expect(await content.getBlogArticleDetail('reviewed')).toEqual(article)
    expect(await content.getAllBlogArticles()).toEqual([article])
    expect(await content.getBlogPodcastPaths()).toEqual([
      { showSlug: 'logos-state', slug: 'episode' },
    ])
    expect(
      await content.getBlogPodcastDetail('logos-state', 'episode')
    ).toEqual(podcast)
    expect(await content.getAllBlogPodcasts()).toEqual([podcast])
    expect(await content.getBlogPodcastShowSlugs()).toEqual(['logos-state'])
    await expect(
      content.getBlogArticleDetail('new-unreviewed')
    ).rejects.toThrow(/absent from reviewed preview/)
    expect(network).not.toHaveBeenCalled()
  })
  it('fails closed on a missing or incompatible artifact', async () => {
    const { readPressSnapshot } = await import('../press-snapshot')
    await expect(
      readPressSnapshot('/missing/press-snapshot.json')
    ).rejects.toThrow()
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    const path = join(directory, 'press.json')
    await writeFile(
      path,
      JSON.stringify({ version: 2, articles: [], podcasts: [] })
    )
    await expect(readPressSnapshot(path)).rejects.toThrow(/Unsupported/)
  })
})
