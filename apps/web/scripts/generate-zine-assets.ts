import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import sharp from 'sharp'
import { getZineCatalogue, getZineIssue } from '@repo/content/loaders'
import { getActiveLocales } from '@repo/content/locales'
import {
  zineDocumentSchema,
  zineTextLayerSchema,
  type ZinePage,
} from '@repo/content/schemas'
import { extractPageText, printPageCrops } from './zines/page-layout'

import { printPdfOptions } from './zines/pdf-options'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function main(): Promise<void> {
  const locale = getActiveLocales()[0]
  const catalogue = await getZineCatalogue(locale)
  for (const edition of catalogue.editions.filter((item) => item.reader)) {
    const issue = await getZineIssue(locale, edition.slug)
    const source = await readFile(resolve(root, 'public', issue.pdf.slice(1)))
    const sourceHash = createHash('sha256').update(source).digest('hex')
    const textLayer = issue.textLayer
      ? zineTextLayerSchema.parse(
          JSON.parse(
            await readFile(
              resolve(root, 'scripts/zines/text-layers', `${issue.slug}.json`),
              'utf8'
            )
          )
        )
      : null
    if (
      textLayer &&
      (textLayer.sourceHash !== sourceHash ||
        textLayer.pages.length !== issue.pageCount)
    )
      throw new Error(`Text layer does not match PDF for ${issue.slug}`)
    const task = getDocument({
      data: new Uint8Array(source),
      ...printPdfOptions,
    })
    const document = await task.promise
    const output = resolve(root, 'public/zines/generated', issue.slug)
    await mkdir(output, { recursive: true })
    const pages: ZinePage[] = []
    for (let index = 0; index < document.numPages; index++) {
      const page = await document.getPage(index + 1)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const annotations = await page.getAnnotations()
      for (const crop of printPageCrops(
        viewport.width,
        viewport.height,
        issue.trim
      )) {
        const number = pages.length
        const scale = 1600 / crop.width
        const canvas = createCanvas(1600, Math.round(crop.height * scale))
        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: canvas.getContext(
            '2d'
          ) as unknown as CanvasRenderingContext2D,
          viewport: page.getViewport({ scale }),
          transform: [1, 0, 0, 1, -crop.x * scale, -crop.y * scale],
        }).promise
        const buffer = canvas.toBuffer('image/png')
        await Promise.all([
          sharp(buffer)
            .webp({ quality: 88 })
            .toFile(resolve(output, `${number}.webp`)),
          sharp(buffer)
            .resize({ width: 320 })
            .webp({ quality: 82 })
            .toFile(resolve(output, `${number}-thumb.webp`)),
        ])
        const links = annotations.flatMap((annotation) => {
          if (
            typeof annotation.url !== 'string' ||
            !/^(https?:\/\/|mailto:)/.test(annotation.url)
          )
            return []
          const url = new URL(annotation.url)
          // The forum in the 2022 print edition now redirects to Logos Research.
          if (url.hostname === 'forum.vac.dev')
            url.hostname = 'forum.research.logos.co'
          const [x1, y1] = viewport.convertToViewportPoint(
            annotation.rect[0],
            annotation.rect[1]
          )
          const [x2, y2] = viewport.convertToViewportPoint(
            annotation.rect[2],
            annotation.rect[3]
          )
          const x = Math.max(0, Math.min(x1, x2) - crop.x)
          const y = Math.max(0, Math.min(y1, y2) - crop.y)
          const width = Math.min(crop.width, Math.max(x1, x2) - crop.x) - x
          const height = Math.min(crop.height, Math.max(y1, y2) - crop.y) - y
          return width > 0 && height > 0
            ? [{ href: url.href, x, y, width, height }]
            : []
        })
        pages.push({
          links,
          number,
          width: crop.width,
          height: crop.height,
          ...(textLayer?.pages[number] ??
            extractPageText(content, viewport.height, crop)),
        })
      }
      page.cleanup()
    }
    if (pages.length !== issue.pageCount)
      throw new Error(`Page count mismatch for ${issue.slug}`)
    const result = zineDocumentSchema.parse({
      schemaVersion: 1,
      slug: issue.slug,
      sourceHash,
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
