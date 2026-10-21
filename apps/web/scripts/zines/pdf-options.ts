import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pdfjsRoot = dirname(
  fileURLToPath(import.meta.resolve('pdfjs-dist/package.json'))
)

// Image-only issues use JPEG 2000; its decoder must be available in Node builds.
export const printPdfOptions = {
  useSystemFonts: true,
  stopAtErrors: true,
  wasmUrl: `${resolve(pdfjsRoot, 'wasm')}/`,
  standardFontDataUrl: `${resolve(pdfjsRoot, 'standard_fonts')}/`,
}
