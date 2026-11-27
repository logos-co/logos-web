import { describe, expect, it } from 'vitest'
import {
  convertPost,
  type GhostPost,
} from '../../scripts/ghost-migration/convert'
import {
  cmsAssetName,
  cmsTagName,
} from '../../scripts/ghost-migration/cms-values'
import { cleanGhostHtml } from '../../scripts/ghost-migration/source-cleanup'

describe('Strapi migration values', () => {
  it('maps Ghost tag labels to the CMS identifier convention without losing acronyms', () => {
    expect(cmsTagName('Parallel Societies')).toBe('Parallel_Societies')
    expect(cmsTagName('long-term storage')).toBe('long_term_storage')
    expect(cmsTagName('zkVM')).toBe('zkVM')
  })
  it('keeps normal asset names and shortens oversized names before the CMS adds variant suffixes', () => {
    expect(cmsAssetName('short-image.png')).toBe('short-image.png')
    expect(cmsAssetName('5f867e76bbc8608f-' + 'x'.repeat(200) + '.png')).toBe(
      '5f867e76bbc8608f.png'
    )
  })
})

function post(html: string): GhostPost {
  return {
    id: 'test',
    uuid: 'uuid',
    title: 'Source title',
    slug: 'source',
    html,
    lexical: '{}',
    status: 'published',
    visibility: 'public',
    published_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    feature_image: 'https://blog.nomos.tech/content/images/cover.png',
    feature_image_alt: null,
    feature_image_caption: null,
    custom_excerpt: null,
    excerpt: 'Summary',
    reading_time: 1,
    url: 'https://blog.nomos.tech/source/',
    codeinjection_head: null,
    codeinjection_foot: null,
    authors: [],
    tags: [],
  }
}

describe('Ghost article conversion', () => {
  it('removes injected promotional anchors and their text while preserving legitimate prose and links', () => {
    const html =
      '<p>Read the <a href="https://rpubs.com/codex/report">report</a>. <a href="https://1winmd.lol/"><u>1winmd.lol</u></a> <a href="https://slotmonkey-casino.site/">casino bonus SlotMonkey</a></p>'
    const result = convertPost(post(html), new Map())
    expect(result.body).toBe(
      '<p>Read the <a href="https://rpubs.com/codex/report">report</a>.  </p>'
    )
    expect(cleanGhostHtml(html)).toBe(result.body)
    expect(cleanGhostHtml(result.body)).toBe(result.body)
    expect(
      cleanGhostHtml(html.replace('Read the', 'Edited introduction: read the'))
    ).not.toBe(result.body)
  })
  it('matches reviewed injected hosts without treating URL query values or host suffixes as injected links', () => {
    const html =
      '<p><a href="//WWW.1WINMD.LOL/path">spam</a><a href="https://github.com/example?ref=1winmd.lol">Code</a><a href="https://1winmd.lol.example.org/">Other host</a></p>'
    expect(cleanGhostHtml(html)).toBe(
      '<p><a href="https://github.com/example?ref=1winmd.lol">Code</a><a href="https://1winmd.lol.example.org/">Other host</a></p>'
    )
  })
  it('preserves every byte outside reviewed injected anchors when repairing CMS bodies', () => {
    const before = "<p class='editorial'>Keep &amp; preserve  whitespace. "
    const after = "<a href='https://github.com/codex-storage'>Code</a></p>"
    expect(
      cleanGhostHtml(
        before + '<a href="https://1winmd.lol/">Injected text</a>' + after
      )
    ).toBe(before + after)
  })
  it('preserves code, captions, footnotes and incoming heading IDs', () => {
    const result = convertPost(
      post(
        '<h1 id="heading">Heading</h1><pre><code>&lt;UploadFileResponse&gt;</code></pre><figure><img src="/content/images/a.png" alt="Alternative"><figcaption>Caption</figcaption></figure><a href="#note">1</a><p id="note">Footnote</p>'
      ),
      new Map([['https://blog.nomos.tech/source', '/media/article/source']])
    )
    expect(result.body).toContain('<h2 id="heading">Heading</h2>')
    expect(result.body).toMatch(/(?:&lt;|&#x3C;)UploadFileResponse>/)
    expect(result.body).toContain('<figcaption>Caption</figcaption>')
    expect(result.body).toContain('href="#note"')
    expect(result.assets).toContain(
      'https://blog.nomos.tech/content/images/a.png'
    )
  })
  it('rewrites only known migrated articles and preserves fragments and queries', () => {
    const result = convertPost(
      post(
        '<a href="https://blog.codex.storage/other/?x=1#heading">Other</a><a href="https://blog.nomos.tech/not-migrated/">Remain</a>'
      ),
      new Map([['https://blog.codex.storage/other', '/media/article/other']])
    )
    expect(result.body).toContain('href="/media/article/other?x=1#heading"')
    expect(result.body).toContain(
      'href="https://blog.nomos.tech/not-migrated/"'
    )
  })
  it('omits injected code and retired newsletter widgets', () => {
    const result = convertPost(
      post(
        '<script>alert(1)</script><form><input><button>Subscribe</button></form><p>Article</p>'
      ),
      new Map()
    )
    expect(result.body).not.toContain('<script')
    expect(result.body).not.toContain('<form')
    expect(result.body).not.toContain('/#/portal/signup')
    expect(result.body).toContain('<p>Article</p>')
  })
  it('renders the source Unicode formula without a runtime script', () => {
    const source = {
      ...post('<p>\\( ϕ_f(α) = 1 - (1 - f)^α \\)</p>'),
      codeinjection_head: 'katex',
    }
    expect(convertPost(source, new Map()).body).toContain(
      'ϕ<sub>f</sub>(α) = 1 - (1 - f)<sup>α</sup>'
    )
  })
  it('preserves unescaped TypeScript generics in legacy raw pre blocks', () => {
    const result = convertPost(
      post(
        '<pre>const result: Promise&lt;UploadFileResponse&gt; = call();\nconst other: Promise<DownloadFileResponse> = call();</pre>'
      ),
      new Map()
    )
    expect(result.body).toMatch(/Promise(?:&lt;|&#x3C;)UploadFileResponse>/)
    expect(result.body).toMatch(/Promise(?:&lt;|&#x3C;)DownloadFileResponse>/)
  })
  it('rejects drafts and restricted posts', () => {
    expect(() =>
      convertPost({ ...post('text'), status: 'draft' }, new Map())
    ).toThrow('Non-public')
    expect(() =>
      convertPost({ ...post('text'), visibility: 'members' }, new Map())
    ).toThrow('Non-public')
  })
})
