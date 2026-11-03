import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import matter from 'gray-matter'
import sharp from 'sharp'
import { convertArticle } from './convert'

const [sourceArg, outputArg] = process.argv.slice(2)
if (!sourceArg || !outputArg)
  throw new Error('Usage: tsx prepare.ts <Waku checkout> <output directory>')
const source = resolve(sourceArg)
const output = resolve(outputArg)
const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim()
const files = (await readdir(join(source, 'posts')))
  .filter((file) => /\.mdx?$/.test(file) && file !== 'index.mdx')
  .sort()
const originals = await Promise.all(
  files.map((file) => readFile(join(source, 'posts', file), 'utf8'))
)
const slugs = new Set(originals.map((text) => String(matter(text).data.slug)))
if (slugs.size !== files.length) throw new Error('Duplicate source slugs')
const authorsYaml = await readFile(join(source, 'posts/authors.yml'), 'utf8')
const authors = matter(`---\n${authorsYaml}\n---`).data
const articles = originals.map((text, index) =>
  convertArticle(files[index], text, slugs, authors)
)
await mkdir(join(output, 'assets'), { recursive: true })
await mkdir(join(output, 'source'), { recursive: true })
await Promise.all(
  files.map((file) =>
    copyFile(join(source, 'posts', file), join(output, 'source', file))
  )
)
await writeFile(join(output, 'source/authors.yml'), authorsYaml)
const assets: Array<{
  sourceUrl: string
  name: string
  sha256: string
  width: number
  height: number
  mime: string
}> = []
for (const url of new Set(articles.flatMap((article) => article.images))) {
  const parsed = new URL(url)
  if (parsed.origin !== 'https://blog.waku.org')
    throw new Error(`Review external asset before importing: ${url}`)
  const bytes = await readFile(
    join(source, 'static', decodeURIComponent(parsed.pathname))
  )
  const hash = createHash('sha256').update(bytes).digest('hex')
  const name = `waku-${hash.slice(0, 12)}-${parsed.pathname.split('/').at(-1)}`
  await writeFile(join(output, 'assets', name), bytes)
  const { width, height, format } = await sharp(bytes).metadata()
  if (!width || !height || !format) throw new Error(`Invalid image: ${url}`)
  assets.push({
    sourceUrl: url,
    name,
    sha256: hash,
    width,
    height,
    mime: `image/${format}`,
  })
}
await writeFile(
  join(output, 'plan.json'),
  JSON.stringify(
    { source: 'acid-info/blog.waku.org', commit, articles, assets },
    null,
    2
  )
)
await writeFile(
  join(output, 'redirects.json'),
  JSON.stringify(
    articles.map(({ slug }) => ({
      from: `https://blog.waku.org/${slug}`,
      to: `https://logos.co/media/article/${slug}`,
    })),
    null,
    2
  )
)
process.stdout.write(
  `Prepared ${articles.length} articles and ${assets.length} images from ${commit}\n`
)
