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
  it('sanitises normal HTML in existing snapshots and preserves isolated embeds', async () => {
    const { readPressSnapshot } = await import('../press-snapshot')
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    const path = join(directory, 'press.json')
    const html = '<p data-extra="ignored">Reviewed <strong>text</strong></p>'
    const clean = '<p>Reviewed <strong>text</strong></p>'
    const interactive = {
      type: 'interactive-embed',
      html: '<section class="authored-layout">Interactive article</section>',
    }
    const legacy = { type: 'text', html, embed: { src: '', html } }
    await writeFile(
      path,
      JSON.stringify({
        version: 1,
        articles: [
          {
            slug: 'article',
            summaryHtml: html,
            bodyHtml:
              html + '<iframe src="https://example.com/document"></iframe>',
            content: [legacy],
            blocks: [{ type: 'rich-text', body: html }, interactive],
            relatedArticles: [{ summaryHtml: html }],
          },
        ],
        podcasts: [
          {
            slug: 'episode',
            creditsHtml: html,
            credits: [legacy],
            footnotes: [{ valueHTML: html }],
            relatedEpisodes: [{ bodyHtml: html }],
          },
        ],
      })
    )

    const snapshot = await readPressSnapshot(path)

    expect(snapshot).toMatchObject({
      articles: [
        {
          summaryHtml: clean,
          content: [{ html: clean, embed: { html: clean } }],
          blocks: [{ type: 'rich-text', body: clean }, interactive],
          relatedArticles: [{ summaryHtml: clean }],
        },
      ],
      podcasts: [
        {
          creditsHtml: clean,
          credits: [{ html: clean }],
          footnotes: [{ valueHTML: clean }],
          relatedEpisodes: [{ bodyHtml: clean }],
        },
      ],
    })
    expect(snapshot.articles[0].bodyHtml).toContain(clean)
    expect(snapshot.articles[0].bodyHtml).not.toContain('https://example.com')
  })
  it('preserves namespaced anchors when a reviewed snapshot is loaded again', async () => {
    const { readPressSnapshot } = await import('../press-snapshot')
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    const path = join(directory, 'press.json')
    const article = {
      slug: 'reviewed',
      bodyHtml: '<h2 id="설명">설명</h2><p><a href="#설명">설명</a></p>',
      toc: [
        { level: 0, href: '#title-anchor' },
        { level: 2, href: '#설명' },
      ],
    }
    const podcast = {
      slug: 'episode',
      creditsHtml: '<h2 id="credits">Credits</h2>',
      blocks: [
        { type: 'rich-text', body: '<p><a href="#credits">Credits</a></p>' },
      ],
    }
    await writeFile(
      path,
      JSON.stringify({ version: 1, articles: [article], podcasts: [podcast] })
    )

    const snapshot = await readPressSnapshot(path)
    const [{ bodyHtml, toc }] = snapshot.articles
    const [{ creditsHtml, blocks }] = snapshot.podcasts
    const href = '#%EC%84%A4%EB%AA%85'

    expect(bodyHtml).toContain('id="media-content-설명"')
    expect(bodyHtml).toContain(`href="${href}"`)
    expect(toc.map((item) => item.href)).toEqual(['#title-anchor', href])
    expect(creditsHtml).toContain('id="media-content-credits"')
    expect(blocks?.[0]).toMatchObject({
      body: '<p><a href="#credits">Credits</a></p>',
    })

    await writeFile(path, JSON.stringify(snapshot))
    const reviewedAgain = await readPressSnapshot(path)
    expect(reviewedAgain).toEqual(snapshot)
  })

  it('keeps public fragments stable when a new ID requires another namespace', async () => {
    const { readPressSnapshot } = await import('../press-snapshot')
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    const path = join(directory, 'press.json')
    const original = {
      slug: 'reviewed',
      bodyHtml: '<h2 id="summary">Summary</h2>',
      toc: [{ level: 2, href: '#summary' }],
    }
    await writeFile(
      path,
      JSON.stringify({ version: 1, articles: [original], podcasts: [] })
    )
    const [before] = (await readPressSnapshot(path)).articles
    expect(before.mediaAnchorPrefix).toBe('media-content-')

    const ids = ['summary', 'media-content-summary', 'media-content-1-summary']
    const links = [
      ...ids.map((id) => `<a href="#${id}">Section</a>`),
      '<a href="#top">Back to top</a>',
      '<a href="#:~:text=Summary">Show text</a>',
      '<a href="#summary:~:text=Summary">Show text in section</a>',
    ]
    await writeFile(
      path,
      JSON.stringify({
        version: 1,
        articles: [
          {
            slug: 'reviewed',
            bodyHtml:
              ids.map((id) => `<h2 id="${id}">Summary</h2>`).join('') +
              links.join(''),
            toc: ids.map((id) => ({ level: 2, href: `#${id}` })),
          },
        ],
        podcasts: [],
      })
    )

    const snapshot = await readPressSnapshot(path)
    const [article] = snapshot.articles
    expect(article.mediaAnchorPrefix).toBe('media-content-2-')
    const scoped = ids.map((id) => `media-content-2-${id}`)
    expect(article.toc[0].href).toBe(before.toc[0].href)
    expect(article.toc.map((item) => item.href)).toEqual(
      ids.map((id) => `#${id}`)
    )
    for (const id of scoped) {
      expect(article.bodyHtml).toContain(`id="${id}"`)
    }
    for (const id of ids) {
      expect(article.bodyHtml).toContain(`href="#${id}"`)
    }
    expect(article.bodyHtml).toContain('href="#top"')
    expect(article.bodyHtml).toContain('href="#:~:text=Summary"')
    expect(article.bodyHtml).toContain('href="#summary:~:text=Summary"')

    await writeFile(path, JSON.stringify(snapshot))
    expect(await readPressSnapshot(path)).toEqual(snapshot)
  })

  it('preserves HTML IDs and legacy named anchors across a snapshot round trip', async () => {
    const { readPressSnapshot } = await import('../press-snapshot')
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    const path = join(directory, 'press.json')
    const article = {
      slug: 'reviewed',
      bodyHtml: [
        '<a href="#credits">Credits</a><a href="#references">References</a>',
        '<a href="#endnotes">Endnotes</a>',
        '<div id="credits">Credits</div>',
        '<p><a id="endnotes" name="references"></a>References</p>',
      ].join(''),
    }
    await writeFile(
      path,
      JSON.stringify({ version: 1, articles: [article], podcasts: [] })
    )
    const snapshot = await readPressSnapshot(path)
    const body = snapshot.articles[0].bodyHtml
    expect(body).toContain('<div id="media-content-credits">')
    expect(body).toContain(
      '<a id="media-content-endnotes" name="media-content-references">'
    )
    for (const id of ['credits', 'endnotes', 'references']) {
      expect(body).toContain(`href="#${id}"`)
    }
    await writeFile(path, JSON.stringify(snapshot))
    expect(await readPressSnapshot(path)).toEqual(snapshot)
  })

  it('keeps table headers associated when their IDs are scoped and read again', async () => {
    const { readPressSnapshot } = await import('../press-snapshot')
    directory = await mkdtemp(join(tmpdir(), 'press-snapshot-'))
    const path = join(directory, 'press.json')
    const article = {
      slug: 'reviewed',
      bodyHtml: [
        '<table><thead><tr><th id="category">Category</th>',
        '<th id="media-content-month" headers="category">Month</th></tr></thead>',
        '<tbody><tr><td headers="category media-content-month">November</td></tr></tbody></table>',
      ].join(''),
    }
    await writeFile(
      path,
      JSON.stringify({ version: 1, articles: [article], podcasts: [] })
    )

    const snapshot = await readPressSnapshot(path)
    const [post] = snapshot.articles
    expect(post.mediaAnchorPrefix).toBe('media-content-1-')
    expect(post.bodyHtml).toContain('id="media-content-1-category"')
    expect(post.bodyHtml).toContain(
      '<th id="media-content-1-media-content-month" headers="media-content-1-category">Month</th>'
    )
    expect(post.bodyHtml).toContain(
      'headers="media-content-1-category media-content-1-media-content-month"'
    )

    await writeFile(path, JSON.stringify(snapshot))
    expect(await readPressSnapshot(path)).toEqual(snapshot)
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
      JSON.stringify({ version: 3, articles: [], podcasts: [] })
    )
    await expect(readPressSnapshot(path)).rejects.toThrow(/Unsupported/)
  })
})
