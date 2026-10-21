import type { ZineBlock, ZineWord } from '@repo/content/schemas'

export function ocrConfidenceScore(tsv: string): number {
  return tsv
    .split('\n')
    .slice(1)
    .reduce((score, line) => {
      const cells = line.split('\t')
      const letters = (cells.slice(11).join(' ').match(/[a-z]/gi) ?? []).length
      return (
        score +
        (cells[0] === '5' && Number(cells[10]) >= 75 && letters >= 3
          ? letters
          : 0)
      )
    }, 0)
}

/** TSV word boxes are in raster pixels; the reader uses PDF points. */
export function parseOcrTsv(
  tsv: string,
  scale: number
): { words: ZineWord[]; blocks: ZineBlock[] } {
  const words: ZineWord[] = []
  const blocks = new Map<string, ZineBlock>()
  const round = (value: number): number => Math.round(value * 100) / 100
  for (const line of tsv.trim().split('\n').slice(1)) {
    const cells = line.split('\t')
    const text = cells.slice(11).join('\t').trim()
    if (cells[0] !== '5' || !text) continue
    const word = {
      text,
      x: round(Number(cells[6]) / scale),
      y: round(Number(cells[7]) / scale),
      width: round(Number(cells[8]) / scale),
      height: round(Math.max(1, Number(cells[9])) / scale),
    }
    const start = words.length
    words.push(word)
    const key = `${cells[2]}-${cells[3]}`
    const previous = blocks.get(key)
    const x = Math.min(previous?.x ?? word.x, word.x)
    const y = Math.min(previous?.y ?? word.y, word.y)
    blocks.set(key, {
      x,
      y,
      width: round(
        Math.max(
          previous ? previous.x + previous.width : 0,
          word.x + word.width
        ) - x
      ),
      height: round(
        Math.max(
          previous ? previous.y + previous.height : 0,
          word.y + word.height
        ) - y
      ),
      start: previous?.start ?? start,
      end: words.length,
    })
  }
  return {
    words,
    blocks: [...blocks.values()].filter(
      (block) =>
        block.y >= 30 &&
        !(
          block.end - block.start === 1 && /^\d+$/.test(words[block.start].text)
        )
    ),
  }
}
