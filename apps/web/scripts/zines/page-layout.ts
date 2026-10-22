import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api'
import { extractText } from './extract-text'

export interface PrintPageCrop {
  x: number
  y: number
  width: number
  height: number
}

/** Some supplied PDFs contain two facing pages in each landscape sheet. */
export function printPageCrops(
  width: number,
  height: number,
  trim: number
): PrintPageCrop[] {
  const count = width > height ? 2 : 1
  return Array.from({ length: count }, (_, index) => ({
    x: (index * width) / count + trim,
    y: trim,
    width: width / count - 2 * trim,
    height: height - 2 * trim,
  }))
}

export function extractPageText(
  content: TextContent,
  pageHeight: number,
  crop: PrintPageCrop
): ReturnType<typeof extractText> {
  const items = content.items
    .filter((item): item is TextItem => {
      if (!('str' in item)) return false
      const centre = item.transform[4] + item.width / 2
      return centre >= crop.x && centre < crop.x + crop.width
    })
    .map((item) => ({
      ...item,
      transform: [
        ...item.transform.slice(0, 4),
        item.transform[4] - crop.x,
        item.transform[5] + crop.y,
      ],
    }))
  return extractText({ ...content, items }, pageHeight, 0)
}
