import assert from 'node:assert/strict'
import { readFile, writeFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { rehype } from 'rehype'
import type { GhostPost } from './convert'
import type { BlogArticleDetail } from '../../lib/blog-content'

const [directoryArg, exportArg = 'out'] = process.argv.slice(2)
if (!directoryArg)
  throw new Error('Usage: tsx verify.ts <capture directory> [export directory]')
const directory = resolve(directoryArg)
const plan: { articles: BlogArticleDetail[] } = JSON.parse(
  await readFile(join(directory, 'plan.json'), 'utf8')
)
const posts = (
  await Promise.all(
    ['nomos', 'codex'].map(
      async (source) =>
        JSON.parse(
          await readFile(join(directory, `${source}-published.json`), 'utf8')
        ) as { posts: GhostPost[] }
    )
  )
).flatMap((source) => source.posts)
const parser = rehype().data('settings', { fragment: true })
type Node = ReturnType<typeof parser.parse>['children'][number]
function elements(
  node: Node,
  tag?: string
): Extract<Node, { type: 'element' }>[] {
  if (node.type !== 'element') return []
  if (
    Array.isArray(node.properties.className) &&
    node.properties.className.includes('kg-signup-card')
  )
    return []
  return [
    ...(!tag || node.tagName === tag ? [node] : []),
    ...node.children.flatMap((child) => elements(child, tag)),
  ]
}
const text = (node: Node): string =>
  node.type === 'text'
    ? node.value
    : 'children' in node
      ? node.children.map(text).join('')
      : ''
const normalise = (value: string) =>
  value
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$1')
    .replaceAll('ϕ_f', 'ϕf')
    .replaceAll('^α', 'α')
    .replace(/\s+/g, ' ')
    .trim()
const sitemap = await readFile(join(exportArg, 'sitemap.xml'), 'utf8')
const feed = await readFile(join(exportArg, 'rss.xml'), 'utf8')
const search: { documents: Array<{ slug: string }> } = JSON.parse(
  await readFile(join(exportArg, 'media-search-index.json'), 'utf8')
)
const results: Array<{
  slug: string
  paragraphs: number
  images: number
  codeBlocks: number
  passed: boolean
}> = []
for (const article of plan.articles) {
  const source = posts.find((post) => post.slug === article.slug)!
  const sourceElements = parser
    .parse(source.html)
    .children.flatMap((node) => elements(node))
  const html = await readFile(
    join(exportArg, 'media/article', article.slug, 'index.html'),
    'utf8'
  )
  const nodes = parser.parse(html).children.flatMap((node) => elements(node))
  const body = nodes.find(
    (node) =>
      node.tagName === 'section' &&
      Array.isArray(node.properties.className) &&
      node.properties.className.includes('media-detail-content')
  )!
  assert(body, `Body absent: ${article.slug}`)
  const rendered = elements(body)
  assert.deepEqual(
    rendered.filter((node) => /^h[2-6]$/.test(node.tagName)).map(text),
    sourceElements.filter((node) => /^h[1-6]$/.test(node.tagName)).map(text),
    `Headings: ${article.slug}`
  )
  const actualParagraphs = rendered
    .filter((node) => node.tagName === 'p')
    .map((node) => normalise(text(node)))
  for (const paragraph of sourceElements.filter(
    (node) => node.tagName === 'p'
  )) {
    const value = normalise(text(paragraph))
    if (value)
      assert(
        actualParagraphs.includes(value),
        `Missing paragraph: ${article.slug}: ${value.slice(0, 90)}`
      )
  }
  assert.deepEqual(
    rendered.filter((node) => node.tagName === 'figcaption').map(text),
    sourceElements.filter((node) => node.tagName === 'figcaption').map(text),
    `Captions: ${article.slug}`
  )
  const originals = [...source.html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)]
  const code = rendered.filter((node) => node.tagName === 'pre')
  assert.equal(code.length, originals.length, `Code blocks: ${article.slug}`)
  originals.forEach((match, index) => {
    const raw = match[1]!
    const expected = /^\s*<code\b/i.test(raw)
      ? parser.parse(raw).children.map(text).join('')
      : parser
          .parse(
            `<textarea>${raw.replace(/<\/textarea/gi, '&#x3C;/textarea')}</textarea>`
          )
          .children.map(text)
          .join('')
    assert.equal(text(code[index]!), expected, `Code text: ${article.slug}`)
  })
  for (const node of nodes) {
    for (const attribute of ['src', 'href', 'poster']) {
      const value = node.properties[attribute]
      if (typeof value !== 'string') continue
      const url = new URL(value, 'https://logos.co')
      assert(
        !['blog.nomos.tech', 'blog.codex.storage'].includes(url.hostname),
        `Retired host dependency: ${article.slug}: ${value}`
      )
      if (value.startsWith('/files/ghost-migration/'))
        await access(join(exportArg, value))
    }
  }
  const images = rendered.filter((node) => node.tagName === 'img')
  assert.equal(
    images.length,
    sourceElements.filter((node) => node.tagName === 'img').length,
    `Image count: ${article.slug}`
  )
  for (const image of images)
    await access(
      join(exportArg, String(image.properties.src).replace(/^\//, ''))
    )
  assert.equal(
    rendered.filter((node) => node.tagName === 'iframe').length,
    sourceElements.filter((node) => node.tagName === 'iframe').length,
    `Videos: ${article.slug}`
  )
  assert(
    !rendered.some((node) =>
      ['script', 'form', 'style'].includes(node.tagName)
    ),
    `Runtime injection: ${article.slug}`
  )
  assert(
    html.includes('content="noindex, nofollow"'),
    `Noindex: ${article.slug}`
  )
  assert(
    !sitemap.includes(`/media/article/${article.slug}<`),
    `Sitemap draft leak: ${article.slug}`
  )
  assert(
    !feed.includes(`/media/article/${article.slug}<`),
    `Feed draft leak: ${article.slug}`
  )
  assert(
    search.documents.some((document) => document.slug === article.slug),
    `Search absent: ${article.slug}`
  )
  assert.equal(
    nodes.filter((node) => node.tagName === 'h1').length,
    1,
    `Duplicate page title: ${article.slug}`
  )
  results.push({
    slug: article.slug,
    paragraphs: actualParagraphs.length,
    images: images.length,
    codeBlocks: code.length,
    passed: true,
  })
}
await writeFile(
  join(directory, 'verification.json'),
  JSON.stringify(
    { checkedAt: new Date().toISOString(), count: results.length, results },
    null,
    2
  )
)
process.stdout.write(
  `Verified ${results.length} complete exports against captured Ghost source: paragraphs, headings, code, captions, images, videos, noindex, search and publication boundaries\n`
)
