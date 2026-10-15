import { createCanvas } from '@napi-rs/canvas'
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api'
import type { ZineBlock, ZineWord } from '@repo/content/schemas'

interface ExtractedText {
  words: ZineWord[]
  blocks: ZineBlock[]
}
interface Line extends ZineBlock {
  fontHeight: number
}
const round = (value: number): number => Math.round(value * 100) / 100

/** Join inline PDF runs before grouping lines, preserving the source's column order. */
export function extractText(
  content: TextContent,
  pageHeight: number,
  trim: number
): ExtractedText {
  const context = createCanvas(1, 1).getContext('2d')
  const items = content.items.filter(
    (item): item is TextItem =>
      'str' in item && item.str.trim().length > 0 && item.width > 0
  )
  const words: ZineWord[] = []
  const lines: Line[] = []
  for (const item of items) {
    const height = Math.hypot(item.transform[2], item.transform[3])
    const x = item.transform[4] - trim
    const y = pageHeight - item.transform[5] - trim - height * 0.8
    context.font = `${height}px sans-serif`
    const scale = item.width / context.measureText(item.str).width
    const start = words.length
    for (const match of item.str.matchAll(/\S+/g)) {
      words.push({
        text: match[0],
        x: round(
          x + context.measureText(item.str.slice(0, match.index)).width * scale
        ),
        y: round(y),
        width: round(context.measureText(match[0]).width * scale),
        height: round(height),
      })
    }
    // Running headers and folios remain selectable but are not guided reading blocks.
    if (y < 32 || /^\d{1,2}$/.test(item.str)) continue
    const previous = lines.at(-1)
    if (
      previous &&
      Math.abs(y - previous.y) < 2 &&
      x >= previous.x &&
      x - previous.x - previous.width < 18
    ) {
      lines[lines.length - 1] = {
        ...previous,
        width: round(x + item.width - previous.x),
        height: Math.max(previous.height, height),
        end: words.length,
      }
    } else
      lines.push({
        x: round(x),
        y: round(y),
        width: round(item.width),
        height: round(height),
        fontHeight: height,
        start,
        end: words.length,
      })
  }
  const blocks: ZineBlock[] = []
  let previous: Line | undefined
  for (const line of lines) {
    const last = blocks.at(-1)
    const newBlock =
      !previous ||
      Math.abs(line.x - previous.x) > 12 ||
      line.y < previous.y - 2 ||
      line.y - previous.y > previous.fontHeight * 1.65 ||
      Math.abs(line.fontHeight - previous.fontHeight) > 2
    if (newBlock || !last)
      blocks.push({
        x: line.x,
        y: line.y,
        width: line.width,
        height: line.height,
        start: line.start,
        end: line.end,
      })
    else
      blocks[blocks.length - 1] = {
        ...last,
        width: round(Math.max(last.width, line.x + line.width - last.x)),
        height: round(Math.max(last.height, line.y + line.height - last.y)),
        end: line.end,
      }
    previous = line
  }
  return { words, blocks }
}
