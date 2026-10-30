import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { env } from '../../lib/env'
import type { SourceArticle } from './convert'

interface Plan {
  commit: string
  articles: SourceArticle[]
}
interface Imported {
  commit: string
  posts: Array<{ id: number; slug: string }>
  assets: Record<string, { url: string }>
}
interface Post {
  id: number
  attributes: {
    slug: string
    body: string
    markdown_body: string
    publishedAt: string | null
  }
}

const [baselineArg, revisedArg, flag] = process.argv.slice(2)
if (!baselineArg || !revisedArg || flag !== '--apply')
  throw new Error(
    'Usage: tsx revise.ts <original import> <revised plan> --apply'
  )
if (!env.STRAPI_API_KEY) throw new Error('STRAPI_API_KEY is required')
const baseline = resolve(baselineArg)
const revised = resolve(revisedArg)
const before: Plan = JSON.parse(
  await readFile(join(baseline, 'plan.json'), 'utf8')
)
const after: Plan = JSON.parse(
  await readFile(join(revised, 'plan.json'), 'utf8')
)
const imported: Imported = JSON.parse(
  await readFile(join(baseline, 'imported.json'), 'utf8')
)
if (before.commit !== after.commit || before.commit !== imported.commit)
  throw new Error('Source revisions do not match')

const origin = 'https://cms-press.logos.co'
const headers = {
  Authorization: `Bearer ${env.STRAPI_API_KEY}`,
  'Content-Type': 'application/json',
}
const withAssets = (body: string) => {
  for (const [url, file] of Object.entries(imported.assets))
    body = body.replaceAll(url, new URL(file.url, origin).href)
  return body
}
async function request(id: number, init: RequestInit = {}): Promise<Post> {
  const response = await fetch(`${origin}/api/posts/${id}`, {
    ...init,
    headers,
  })
  if (!response.ok) throw new Error(`CMS post ${id}: ${response.status}`)
  return (await response.json()).data as Post
}

const pending: Array<{ post: Post; body: string }> = []
for (const article of after.articles) {
  const old = before.articles.find((item) => item.slug === article.slug)
  const entry = imported.posts.find((item) => item.slug === article.slug)
  if (!old || !entry || old.markdown_body !== article.markdown_body)
    throw new Error(`Original source does not match: ${article.slug}`)
  const post = await request(entry.id)
  const body = withAssets(article.body)
  if (
    post.attributes.slug !== article.slug ||
    post.attributes.publishedAt ||
    post.attributes.markdown_body !== old.markdown_body ||
    (post.attributes.body !== withAssets(old.body) &&
      post.attributes.body !== body)
  )
    throw new Error(
      `Refusing to overwrite changed/published content: ${article.slug}`
    )
  if (post.attributes.body !== body) pending.push({ post, body })
}
await writeFile(
  join(revised, 'revision-backup.json'),
  JSON.stringify(pending, null, 2),
  { flag: 'wx' }
)
for (const { post, body } of pending) {
  const current = await request(post.id)
  if (JSON.stringify(current.attributes) !== JSON.stringify(post.attributes))
    throw new Error(`Post changed after preflight: ${post.attributes.slug}`)
  const updated = await request(post.id, {
    method: 'PUT',
    body: JSON.stringify({ data: { body } }),
  })
  if (updated.attributes.body !== body || updated.attributes.publishedAt)
    throw new Error(`Revision verification failed: ${post.attributes.slug}`)
  process.stdout.write(`Draft revised: ${post.attributes.slug}\n`)
}
process.stdout.write(
  `Verified ${after.articles.length} drafts; revised ${pending.length} bodies\n`
)
