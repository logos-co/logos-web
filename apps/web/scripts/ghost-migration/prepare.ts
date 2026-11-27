import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import sharp from 'sharp'
import { convertPost, type GhostPost } from './convert'
import type { BlogArticleDetail } from '../../lib/blog-content'
import type { PressSnapshot } from '../../lib/press-snapshot'

const [directoryArg] = process.argv.slice(2)
if (!directoryArg) throw new Error('Usage: tsx prepare.ts <capture directory>')
const directory = resolve(directoryArg)
const sources = await Promise.all(
  ['nomos', 'codex'].map(async (source) => ({
    source,
    ...(JSON.parse(
      await readFile(join(directory, `${source}-published.json`), 'utf8')
    ) as { posts: GhostPost[] }),
  }))
)
const baseline: PressSnapshot = JSON.parse(
  await readFile('lib/data/press.snapshot.json', 'utf8')
)
const posts = sources.flatMap(({ posts }) => posts)
if (posts.length !== 87)
  throw new Error(`Expected 87 posts, received ${posts.length}`)
const slugs = new Set(baseline.articles.map((post) => post.slug))
for (const post of posts) {
  if (slugs.has(post.slug)) throw new Error(`Slug collision: ${post.slug}`)
  slugs.add(post.slug)
}
const destinations = new Map(
  posts.map((post) => [
    new URL(post.url).origin + new URL(post.url).pathname.replace(/\/$/, ''),
    `/media/article/${post.slug}`,
  ])
)
const converted = posts.map((post) => ({
  post,
  ...convertPost(post, destinations),
}))
const urls = [...new Set(converted.flatMap((article) => article.assets))]
const assets = new Map<
  string,
  {
    url: string
    name: string
    width: number
    height: number
    mime: string
    alt?: string
    caption?: string
  }
>()
await mkdir(join(directory, 'assets'), { recursive: true })
await mkdir('public/images/ghost-migration', { recursive: true })
await mkdir('public/files/ghost-migration', { recursive: true })
let cursor = 0
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++]!
      const parsed = new URL(url)
      if (!['blog.nomos.tech', 'blog.codex.storage'].includes(parsed.hostname))
        throw new Error(`Unreviewed asset host: ${url}`)
      const name = `${createHash('sha256').update(url).digest('hex').slice(0, 16)}-${basename(parsed.pathname).replace(/[^a-zA-Z0-9._-]/g, '-')}`
      let bytes: Buffer
      try {
        bytes = await readFile(join(directory, 'assets', name))
      } catch {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30000),
        })
        if (!response.ok)
          throw new Error(`Asset HTTP ${response.status}: ${url}`)
        bytes = Buffer.from(await response.arrayBuffer())
        await writeFile(join(directory, 'assets', name), bytes)
      }
      const attachment = parsed.pathname.startsWith('/content/files/')
      const metadata = attachment
        ? { width: 0, height: 0, format: 'pdf' }
        : await sharp(bytes).metadata()
      if (!attachment && (!metadata.width || !metadata.height))
        throw new Error(`Image dimensions missing: ${url}`)
      await writeFile(
        join(
          attachment
            ? 'public/files/ghost-migration'
            : 'public/images/ghost-migration',
          name
        ),
        bytes
      )
      assets.set(url, {
        name,
        url: `/${attachment ? 'files' : 'images'}/ghost-migration/${name}`,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        mime: attachment ? 'application/pdf' : `image/${metadata.format}`,
        alt:
          posts.find((post) => post.feature_image === url)?.feature_image_alt ||
          undefined,
        caption:
          posts.find((post) => post.feature_image === url)
            ?.feature_image_caption || undefined,
      })
      process.stdout.write(`Asset ${assets.size}/${urls.length}\n`)
    }
  })
)
const articles: BlogArticleDetail[] = converted.map(
  ({ post, body, toc, summary }) => {
    for (const [source, asset] of assets)
      body = body
        .replaceAll(source.replaceAll('&', '&amp;'), asset.url)
        .replaceAll(source, asset.url)
    const cover = assets.get(post.feature_image)!
    return {
      id: `ghost-${post.id}`,
      uuid: post.uuid,
      slug: post.slug,
      type: 'article',
      title: post.title,
      summary,
      publishedAt: post.published_at,
      modifiedAt: post.updated_at,
      createdAt: post.created_at,
      tags: post.tags
        .filter((tag) => tag.visibility === 'public')
        .map(({ id, name }) => ({ id, name })),
      authors: post.authors.map(({ id, name }) => ({ id, name })),
      coverImage: {
        url: cover.url,
        alt: post.feature_image_alt || post.title,
        caption: post.feature_image_caption || undefined,
        width: cover.width,
        height: cover.height,
      },
      ...(post.og_image
        ? {
            ogImage: {
              url: assets.get(post.og_image)!.url,
              alt: post.title,
              width: assets.get(post.og_image)!.width,
              height: assets.get(post.og_image)!.height,
            },
          }
        : {}),
      isDraft: true,
      readingTime: post.reading_time,
      bodyHtml: body,
      toc,
      footnotes: [],
      relatedArticles: [],
      articlesFromSameAuthors: [],
    }
  }
)
const snapshot: PressSnapshot = {
  ...baseline,
  version: 2,
  articles: [...baseline.articles, ...articles],
}
await writeFile(
  join(directory, 'press-snapshot.json'),
  JSON.stringify(snapshot)
)
await writeFile(
  join(directory, 'plan.json'),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      articles,
      assets: Object.fromEntries(assets),
      excludedCodeInjections: posts
        .filter((p) => p.codeinjection_foot)
        .map((p) => p.slug),
    },
    null,
    2
  )
)
await writeFile(
  join(directory, 'redirects.json'),
  JSON.stringify(
    posts.map((post) => ({
      from: post.url,
      to: `https://logos.co/media/article/${post.slug}`,
    })),
    null,
    2
  )
)
const allowlist = JSON.parse(
  await readFile('lib/press-preview-articles.json', 'utf8')
) as string[]
await writeFile(
  'lib/press-preview-articles.json',
  JSON.stringify(
    [...new Set([...allowlist, ...posts.map((post) => post.slug)])],
    null,
    2
  ) + '\n'
)
process.stdout.write(
  `Prepared ${articles.length} drafts, ${assets.size} assets; baseline ${baseline.articles.length} published articles\n`
)
