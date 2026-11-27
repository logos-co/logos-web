import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { env } from '../../lib/env'
import type { BlogArticleDetail } from '../../lib/blog-content'
import type { GhostPost } from './convert'

interface Entity {
  id: number
  attributes: Record<string, unknown>
}
interface Upload {
  id: number
  name: string
  url: string
}
interface Asset {
  url: string
  name: string
  mime: string
  alt?: string
  caption?: string
}
const [directoryArg, flag] = process.argv.slice(2)
if (!directoryArg || flag !== '--apply')
  throw new Error(
    'Usage: tsx --env-file=.env.local import.ts <capture directory> --apply'
  )
if (!env.STRAPI_API_KEY) throw new Error('STRAPI_API_KEY is required')
const directory = resolve(directoryArg)
const plan: { articles: BlogArticleDetail[]; assets: Record<string, Asset> } =
  JSON.parse(await readFile(join(directory, 'plan.json'), 'utf8'))
const originals = (
  await Promise.all(
    ['nomos', 'codex'].map(
      async (source) =>
        JSON.parse(
          await readFile(join(directory, `${source}-published.json`), 'utf8')
        ) as { posts: GhostPost[] }
    )
  )
).flatMap((source) => source.posts)
const sourceMarker = (source: GhostPost) =>
  `<!-- ghost-source:${source.id}:${createHash('sha256').update(source.html).digest('hex')} -->`
const origin = 'https://cms-press.logos.co'
const headers = { Authorization: `Bearer ${env.STRAPI_API_KEY}` }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(origin + path, {
    ...init,
    headers: { ...headers, ...init.headers },
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok)
    throw new Error(
      `CMS ${init.method ?? 'GET'} ${path}: HTTP ${response.status}`
    )
  return response.json() as Promise<T>
}
async function all(collection: string): Promise<Entity[]> {
  const result: Entity[] = []
  for (let page = 1; ; page++) {
    const data = await request<{
      data: Entity[]
      meta: { pagination: { pageCount: number } }
    }>(
      `/api/${collection}?publicationState=preview&pagination[page]=${page}&pagination[pageSize]=100`
    )
    result.push(...data.data)
    if (page >= data.meta.pagination.pageCount) return result
  }
}
async function create(
  collection: string,
  data: Record<string, unknown>
): Promise<Entity> {
  return (
    await request<{ data: Entity }>(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
  ).data
}
const [posts, authors, tags] = await Promise.all([
  all('posts'),
  all('authors'),
  all('tags'),
])
if (plan.articles.length !== 87 || originals.length !== 87)
  throw new Error('Expected 87 reviewed public posts')
for (const article of plan.articles) {
  const source = originals.find((post) => post.slug === article.slug)
  if (
    !source ||
    source.status !== 'published' ||
    source.visibility !== 'public'
  )
    throw new Error(`Non-public source: ${article.slug}`)
  const matches = posts.filter((post) => post.attributes.slug === article.slug)
  if (matches.length > 1) throw new Error(`Duplicate CMS slug: ${article.slug}`)
  const existing = matches[0]
  if (
    existing &&
    (existing.attributes.publishedAt ||
      existing.attributes.markdown_body !== sourceMarker(source))
  )
    throw new Error(`Existing or published CMS article: ${article.slug}`)
}
async function relation(
  collection: 'authors' | 'tags',
  name: string
): Promise<number> {
  const records = collection === 'authors' ? authors : tags
  const existing = records.find(
    (record) =>
      String(record.attributes.name).toLowerCase() === name.toLowerCase()
  )
  if (existing) return existing.id
  const entity = await create(collection, { name })
  records.push(entity)
  return entity.id
}
const uploads = new Map<string, Upload>()
for (const asset of Object.values(plan.assets)) {
  const existing = await request<Upload[]>(
    `/api/upload/files?filters[name][$eq]=${encodeURIComponent(asset.name)}`
  )
  let file = existing.find((file) => file.name === asset.name)
  if (!file) {
    const form = new FormData()
    form.append(
      'fileInfo',
      JSON.stringify({
        name: asset.name,
        alternativeText: asset.alt,
        caption: asset.caption,
      })
    )
    form.append(
      'files',
      new Blob([await readFile(join(directory, 'assets', asset.name))], {
        type: asset.mime,
      }),
      asset.name
    )
    file = (
      await request<Upload[]>('/api/upload', { method: 'POST', body: form })
    )[0]
  }
  if (!file?.id) throw new Error(`Upload missing: ${asset.name}`)
  uploads.set(asset.url, file)
  if (
    uploads.size % 25 === 0 ||
    uploads.size === Object.keys(plan.assets).length
  )
    process.stdout.write(
      `Assets verified: ${uploads.size}/${Object.keys(plan.assets).length}\n`
    )
}
const imported: Array<{ slug: string; id: number }> = []
for (const article of plan.articles) {
  let body = article.bodyHtml ?? ''
  for (const [local, file] of uploads)
    body = body.replaceAll(local, new URL(file.url, origin).href)
  const authorIds: number[] = []
  for (const author of article.authors)
    authorIds.push(await relation('authors', author.name))
  const tagIds: number[] = []
  for (const tag of article.tags) tagIds.push(await relation('tags', tag.name))
  const cover = uploads.get(article.coverImage!.url)
  if (!cover) throw new Error(`Cover missing: ${article.slug}`)
  const source = originals.find((post) => post.slug === article.slug)!
  const data = {
    title: article.title,
    slug: article.slug,
    type: 'Article',
    publish_date: article.publishedAt,
    publishedAt: null,
    featured: false,
    summary: article.summary,
    body,
    markdown_body: sourceMarker(source),
    authors: authorIds,
    tags: tagIds,
    cover_image: cover.id,
    ...(article.ogImage
      ? { og_image: uploads.get(article.ogImage.url)!.id }
      : {}),
  }
  const latest = await request<{ data: Entity[] }>(
    `/api/posts?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(article.slug)}`
  )
  const existing = latest.data[0]
  if (
    existing &&
    (existing.attributes.publishedAt ||
      existing.attributes.body !== body ||
      existing.attributes.markdown_body !== sourceMarker(source))
  )
    throw new Error(`CMS article changed: ${article.slug}`)
  const saved = existing ?? (await create('posts', data))
  const verification = await request<{ data: Entity }>(
    `/api/posts/${saved.id}?publicationState=preview`
  )
  if (
    verification.data.attributes.publishedAt ||
    verification.data.attributes.body !== body
  )
    throw new Error(`Draft verification failed: ${article.slug}`)
  imported.push({ slug: article.slug, id: saved.id })
  await writeFile(
    join(directory, 'imported.json'),
    JSON.stringify(
      { posts: imported, assets: Object.fromEntries(uploads) },
      null,
      2
    )
  )
  process.stdout.write(`Draft verified: ${article.slug}\n`)
}
