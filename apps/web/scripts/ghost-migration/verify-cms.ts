import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { env } from '../../lib/env'
import type { BlogArticleDetail } from '../../lib/blog-content'
import { cmsTagName } from './cms-values'
import { injectedGhostHosts } from './source-cleanup'

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
  name: string
  url: string
  mime: string
  width: number
  height: number
}
interface Relation {
  data: Entity[]
}
interface FileRelation {
  data: Entity | null
}
const origin = 'https://cms-press.logos.co'
const [directoryArg] = process.argv.slice(2)
if (!directoryArg || !env.STRAPI_API_KEY)
  throw new Error(
    'Usage: tsx --env-file=<credentials> verify-cms.ts <capture directory>'
  )
const directory = resolve(directoryArg)
const plan: { articles: BlogArticleDetail[]; assets: Record<string, Asset> } =
  JSON.parse(await readFile(join(directory, 'plan.json'), 'utf8'))
const receipt: {
  posts: Array<{ slug: string; id: number }>
  assets: Record<string, Upload>
} = JSON.parse(await readFile(join(directory, 'imported.json'), 'utf8'))
assert.equal(receipt.posts.length, 87, 'Expected 87 verified CMS drafts')
assert.equal(
  Object.keys(receipt.assets).length,
  256,
  'Expected 256 uploaded assets'
)
const headers = { Authorization: `Bearer ${env.STRAPI_API_KEY}` }
const posts: Entity[] = []
for (let page = 1; ; page++) {
  const response = await fetch(
    `${origin}/api/posts?publicationState=preview&pagination[pageSize]=100&pagination[page]=${page}&populate=authors,tags,cover_image,og_image`,
    { headers, signal: AbortSignal.timeout(30000), redirect: 'error' }
  )
  assert(response.ok, `CMS posts HTTP ${response.status}`)
  const data = (await response.json()) as {
    data: Entity[]
    meta: { pagination: { pageCount: number } }
  }
  posts.push(...data.data)
  if (page >= data.meta.pagination.pageCount) break
}
const names = (value: unknown) =>
  ((value as Relation).data ?? [])
    .map((entity) => String(entity.attributes.name).toLowerCase())
    .sort()
const urlOf = (value: unknown) => {
  const file = (value as FileRelation)?.data
  return file ? new URL(String(file.attributes.url), origin).href : null
}
const uploadUrl = (local: string) =>
  new URL(receipt.assets[local]!.url, origin).href
for (const article of plan.articles) {
  const id = receipt.posts.find((post) => post.slug === article.slug)!.id
  const post = posts.find((post) => post.id === id)!
  assert(post, `CMS post missing: ${article.slug}`)
  const attributes = post.attributes
  assert.equal(attributes.slug, article.slug)
  assert.equal(attributes.title, article.title)
  assert.equal(attributes.type, 'Article')
  assert.equal(
    attributes.publishedAt,
    null,
    `Unexpected publication: ${article.slug}`
  )
  assert.equal(
    String(attributes.publish_date).slice(0, 10),
    article.publishedAt!.slice(0, 10)
  )
  assert.equal(attributes.summary, article.summary)
  assert.deepEqual(
    names(attributes.authors),
    article.authors.map((author) => author.name.toLowerCase()).sort()
  )
  assert.deepEqual(
    names(attributes.tags),
    article.tags.map((tag) => cmsTagName(tag.name).toLowerCase()).sort()
  )
  assert.equal(
    urlOf(attributes.cover_image),
    uploadUrl(article.coverImage!.url)
  )
  if (article.ogImage)
    assert.equal(urlOf(attributes.og_image), uploadUrl(article.ogImage.url))
  let body = article.bodyHtml ?? ''
  for (const [local, file] of Object.entries(receipt.assets))
    body = body.replaceAll(local, new URL(file.url, origin).href)
  assert.equal(attributes.body, body, `Body mismatch: ${article.slug}`)
  for (const host of injectedGhostHosts)
    assert(
      !body.includes(host),
      `Injected link remains: ${article.slug} ${host}`
    )
  assert(
    !/\/images\/ghost-migration\/|\/files\/ghost-migration\//.test(body),
    `Repository asset dependency: ${article.slug}`
  )
  assert(
    !/https?:\/\/blog\.(?:nomos\.tech|codex\.storage)\//.test(
      body.replace(/\?ref=blog\.(?:nomos\.tech|codex\.storage)/g, '')
    ),
    `Retired host dependency: ${article.slug}`
  )
}
const sourceAssets = Object.values(plan.assets)
let cursor = 0
const results: Array<{
  name: string
  url: string
  bytesIdentical: boolean
  dimensionsVerified: boolean
}> = []
const hash = (value: Buffer) => createHash('sha256').update(value).digest('hex')
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < sourceAssets.length) {
      const asset = sourceAssets[cursor++]!
      const url = uploadUrl(asset.url)
      const response = await fetch(url, {
        signal: AbortSignal.timeout(60000),
        redirect: 'error',
      })
      assert(
        response.ok,
        `Uploaded asset HTTP ${response.status}: ${asset.name}`
      )
      const bytes = Buffer.from(await response.arrayBuffer())
      const original = await readFile(join(directory, 'assets', asset.name))
      const bytesIdentical = hash(bytes) === hash(original)
      if (asset.mime === 'application/pdf')
        assert(bytesIdentical, `PDF bytes changed: ${asset.name}`)
      else {
        const metadata = await sharp(bytes).metadata()
        assert.equal(
          metadata.width,
          asset.width,
          `Image width changed: ${asset.name}`
        )
        assert.equal(
          metadata.height,
          asset.height,
          `Image height changed: ${asset.name}`
        )
        if (asset.mime === 'image/gif') {
          const originalMetadata = await sharp(original).metadata()
          assert.equal(
            metadata.pages ?? 1,
            originalMetadata.pages ?? 1,
            `GIF frame count changed: ${asset.name}`
          )
        }
      }
      results.push({
        name: asset.name,
        url,
        bytesIdentical,
        dimensionsVerified: asset.mime.startsWith('image/'),
      })
      if (results.length % 25 === 0)
        process.stdout.write(`CMS assets checked: ${results.length}/256\n`)
    }
  })
)
await writeFile(
  join(directory, 'cms-verification.json'),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      origin,
      drafts: plan.articles.length,
      assets: results.length,
      byteIdenticalAssets: results.filter((asset) => asset.bytesIdentical)
        .length,
      results,
    },
    null,
    2
  )
)
process.stdout.write(
  `Verified 87 CMS drafts and ${results.length} public uploaded assets; ${results.filter((asset) => asset.bytesIdentical).length} assets retain identical bytes\n`
)
