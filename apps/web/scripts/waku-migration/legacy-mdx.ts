import { unified } from 'unified'
import remarkParse from 'remark-parse'

interface SourceNode {
  type: string
  position?: { start: { offset?: number }; end: { offset?: number } }
  children?: SourceNode[]
}

function normaliseProse(value: string): string {
  return value
    .replace(
      /<span style=\{\{ textDecoration: "underline"\}\}>([:;])<\/span>/g,
      '<u>$1</u>'
    )
    .replace(/\*\*([^\s*][^*\n]*?)([ \t]+)\*\*/g, '**$1**$2')
    .replace(/(^[ \t]*<br\s*\/?>(?:[ \t]*\n))(?=\S)/gm, '$1\n')
}

/** Legacy MDX accepts delimiters/JSX that CommonMark treats as literal text. */
export function normaliseLegacyMdx(source: string): string {
  const tree = unified().use(remarkParse).parse(source)
  const protectedRanges: Array<[number, number]> = []
  const visit = (node: SourceNode) => {
    if (node.type === 'code' || node.type === 'inlineCode') {
      const start = node.position?.start.offset
      const end = node.position?.end.offset
      if (start !== undefined && end !== undefined)
        protectedRanges.push([start, end])
      return
    }
    node.children?.forEach(visit)
  }
  visit(tree)
  let cursor = 0
  let result = ''
  for (const [start, end] of protectedRanges) {
    result += normaliseProse(source.slice(cursor, start))
    result += source.slice(start, end)
    cursor = end
  }
  return result + normaliseProse(source.slice(cursor))
}
