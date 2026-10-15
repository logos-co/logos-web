import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import sharp from 'sharp'
import { getZineCatalogue, getZineIssue } from '@repo/content/loaders'
import { getActiveLocales } from '@repo/content/locales'
import { zineDocumentSchema, type ZinePage } from '@repo/content/schemas'
import { extractText } from './zines/extract-text'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function main(): Promise<void> {
  const catalogue = await getZineCatalogue(getActiveLocales()[0])
  for (const edition of catalogue.editions.filter((item) => item.reader)) {
    const issue = await getZineIssue(getActiveLocales()[0], edition.slug)
    const source = await readFile(resolve(root, 'public', issue.pdf.slice(1)))
    const task = getDocument({
      data: new Uint8Array(source),
      useSystemFonts: true,
    })
    const document = await task.promise
    if (document.numPages !== issue.pageCount)
      throw new Error(`Page count mismatch for ${issue.slug}`)
    const output = resolve(root, 'public/zines/generated', issue.slug)
    await mkdir(output, { recursive: true })
    const pages: ZinePage[] = []
    for (let index = 0; index < document.numPages; index++) {
      const page = await document.getPage(index + 1)
      const viewport = page.getViewport({ scale: 1 })
      const width = viewport.width - 2 * issue.trim
      const height = viewport.height - 2 * issue.trim
      const scale = 1600 / width
      const canvas = createCanvas(1600, Math.round(height * scale))
      const context = canvas.getContext('2d')
      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport: page.getViewport({ scale }),
        transform: [1, 0, 0, 1, -issue.trim * scale, -issue.trim * scale],
      }).promise
      const buffer = canvas.toBuffer('image/png')
      await Promise.all([
        sharp(buffer)
          .webp({ quality: 88 })
          .toFile(resolve(output, `${index}.webp`)),
        sharp(buffer)
          .resize({ width: 320 })
          .webp({ quality: 82 })
          .toFile(resolve(output, `${index}-thumb.webp`)),
      ])
      pages.push({
        number: index,
        width,
        height,
        ...extractText(
          await page.getTextContent(),
          viewport.height,
          issue.trim
        ),
      })
      page.cleanup()
    }
    const result = zineDocumentSchema.parse({
      schemaVersion: 1,
      slug: issue.slug,
      sourceHash: createHash('sha256').update(source).digest('hex'),
      pages,
    })
    await writeFile(resolve(output, 'document.json'), JSON.stringify(result))
    await task.destroy()
    process.stdout.write(
      `Generated ${pages.length} zine pages for ${issue.slug}\n`
    )
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
