import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { env } from '../../lib/env'
import type { SourceArticle } from './convert'

interface Asset {
  sourceUrl: string
  name: string
  mime: string
  width: number
  height: number
}
interface Entity {
  id: number
  attributes: Record<string, unknown>
}
interface Upload {
  id: number
  name: string
  url: string
}

const [directory, flag] = process.argv.slice(2)
if (!directory || flag !== '--apply')
  throw new Error('Usage: tsx import.ts <prepared directory> --apply')
if (!env.STRAPI_API_KEY) throw new Error('STRAPI_API_KEY is required')
const output = resolve(directory)
const plan: { commit: string; articles: SourceArticle[]; assets: Asset[] } =
  JSON.parse(await readFile(join(output, 'plan.json'), 'utf8'))
const origin = 'https://cms-press.logos.co'
const headers = { Authorization: `Bearer ${env.STRAPI_API_KEY}` }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  })
  if (!response.ok)
    throw new Error(`CMS ${init.method ?? 'GET'} ${path}: ${response.status}`)
  return response.json() as Promise<T>
}
async function all(collection: string): Promise<Entity[]> {
  const result: Entity[] = []
  for (let page = 1; ; page++) {
    const response = await request<{
      data: Entity[]
      meta: { pagination: { pageCount: number } }
    }>(
      `/api/${collection}?publicationState=preview&pagination[page]=${page}&pagination[pageSize]=100`
    )
    result.push(...response.data)
    if (page >= response.meta.pagination.pageCount) return result
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
for (const article of plan.articles) {
  const existing = posts.find((post) => post.attributes.slug === article.slug)
  if (
    existing &&
    (existing.attributes.markdown_body !== article.markdown_body ||
      existing.attributes.publishedAt)
  ) {
    throw new Error(
      `Refusing to overwrite an existing or published article: ${article.slug}`
    )
  }
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
const uploaded = new Map<string, Upload>()
for (const asset of plan.assets) {
  const matches = await request<Upload[]>(
    `/api/upload/files?filters[name][$eq]=${encodeURIComponent(asset.name)}`
  )
  let file = matches.find((match) => match.name === asset.name)
  if (!file) {
    const form = new FormData()
    form.append(
      'files',
      new Blob([await readFile(join(output, 'assets', asset.name))], {
        type: asset.mime,
      }),
      asset.name
    )
    file = (
      await request<Upload[]>('/api/upload', { method: 'POST', body: form })
    )[0]
  }
  if (!file?.id) throw new Error(`Upload missing: ${asset.name}`)
  uploaded.set(asset.sourceUrl, file)
}
const imported: Array<{ slug: string; id: number }> = []
for (const article of plan.articles) {
  let body = article.body
  for (const [url, file] of uploaded)
    body = body.replaceAll(url, new URL(file.url, origin).href)
  const authorIds: number[] = []
  for (const name of article.authors)
    authorIds.push(await relation('authors', name))
  const tagIds: number[] = []
  for (const name of article.tags) tagIds.push(await relation('tags', name))
  const cover = uploaded.get(article.cover)
  if (!cover) throw new Error(`Cover missing: ${article.slug}`)
  const data = {
    title: article.title,
    slug: article.slug,
    type: 'Article',
    publish_date: article.publish_date,
    publishedAt: null,
    featured: false,
    summary: article.summary,
    body,
    markdown_body: article.markdown_body,
    authors: authorIds,
    tags: tagIds,
    cover_image: cover.id,
  }
  const existing = posts.find((post) => post.attributes.slug === article.slug)
  if (existing && existing.attributes.body !== body)
    throw new Error(`Imported draft has changed: ${article.slug}`)
  const post = existing ?? (await create('posts', data))
  imported.push({ slug: article.slug, id: post.id })
  await writeFile(
    join(output, 'imported.json'),
    JSON.stringify(
      {
        commit: plan.commit,
        posts: imported,
        assets: Object.fromEntries(uploaded),
      },
      null,
      2
    )
  )
  process.stdout.write(`Draft verified: ${article.slug} (${post.id})\n`)
}
