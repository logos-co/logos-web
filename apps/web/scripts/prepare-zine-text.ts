import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { getZineIssue } from '@repo/content/loaders'
import { getActiveLocales } from '@repo/content/locales'
import { zineTextLayerSchema } from '@repo/content/schemas'
import { printPageCrops } from './zines/page-layout'
import { parseOcrTsv, ocrConfidenceScore } from './zines/ocr'

import { printPdfOptions } from './zines/pdf-options'

const exec = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Editorial preparation only: Tesseract is not a deployment dependency.
async function main(): Promise<void> {
  const issue = await getZineIssue(getActiveLocales()[0], process.argv[2])
  if (!issue.textLayer) throw new Error('This issue uses native PDF text')
  const source = await readFile(resolve(root, 'public', issue.pdf.slice(1)))
  const task = getDocument({
    data: new Uint8Array(source),
    ...printPdfOptions,
  })
  const document = await task.promise
  const temporary = await realpath(
    await mkdtemp(resolve(tmpdir(), 'zine-ocr-'))
  )
  const pages: ReturnType<typeof parseOcrTsv>[] = []
  try {
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number)
      const viewport = page.getViewport({ scale: 1 })
      for (const crop of printPageCrops(
        viewport.width,
        viewport.height,
        issue.trim
      )) {
        const scale = 3
        const canvas = createCanvas(
          Math.ceil(crop.width * scale),
          Math.ceil(crop.height * scale)
        )
        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: canvas.getContext(
            '2d'
          ) as unknown as CanvasRenderingContext2D,
          viewport: page.getViewport({ scale }),
          transform: [1, 0, 0, 1, -crop.x * scale, -crop.y * scale],
        }).promise
        const path = resolve(temporary, 'page.png')
        await writeFile(path, canvas.toBuffer('image/png'))
        const recognise = async (mode: string) => {
          const { stdout } = await exec(
            'tesseract',
            [path, 'stdout', '-l', 'eng', '--psm', mode, 'tsv'],
            { maxBuffer: 10 * 1024 * 1024 }
          )
          return stdout
        }
        const paragraph = await recognise('3')
        const sparse = await recognise('11')
        const selected =
          ocrConfidenceScore(sparse) > ocrConfidenceScore(paragraph) * 1.15
            ? sparse
            : paragraph
        pages.push(parseOcrTsv(selected, scale))
      }
      page.cleanup()
    }
    if (pages.length !== issue.pageCount)
      throw new Error('OCR page count mismatch')
    const result = zineTextLayerSchema.parse({
      sourceHash: createHash('sha256').update(source).digest('hex'),
      pages,
    })
    await writeFile(
      resolve(root, 'scripts/zines/text-layers', `${issue.slug}.json`),
      JSON.stringify(result) + '\n'
    )
  } finally {
    await task.destroy()
    await rm(temporary, { recursive: true, force: true })
  }
}
main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
