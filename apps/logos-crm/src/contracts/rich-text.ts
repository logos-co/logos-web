/**
 * A deliberately small Markdown subset for notes.
 *
 * The Notion CRM's comment field cannot do bullets, bold, or an embedded
 * screenshot, which is the gap this closes. It stores Markdown rather than
 * HTML: the renderer in `rich-text-view.tsx` turns this AST into React
 * elements and never emits markup, so a note is not an injection surface no
 * matter what somebody pastes into it. That is worth more here than feature
 * coverage - notes carry pasted text from strangers.
 *
 * Parsing lives in a contract rather than the component so the same rules
 * apply to a preview, an email excerpt, and a future export.
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'emphasis'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'image'; href: string; alt: string }

export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 2 | 3; children: InlineNode[] }
  | { type: 'quote'; children: InlineNode[] }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }

/**
 * Only these schemes are rendered as links. A `javascript:` or `data:` href in
 * a note somebody pasted is the one way a Markdown renderer that emits no HTML
 * can still execute something, so the check is here rather than left to the
 * browser.
 */
const SAFE_SCHEMES = ['http://', 'https://', 'mailto:']

export function isSafeHref(href: string): boolean {
  const trimmed = href.trim().toLocaleLowerCase('en')
  return SAFE_SCHEMES.some((scheme) => trimmed.startsWith(scheme))
}

const INLINE_PATTERN =
  /(!?)\[([^\]]*)\]\(([^)\s]+)\)|(\*\*|__)(.+?)\4|(\*|_)(.+?)\6|`([^`]+)`/

/**
 * Adjacent text nodes are merged. They appear whenever a match is rejected and
 * falls back to text - an unsafe link, for instance - and leaving them split
 * makes the output depend on how the input happened to tokenise rather than on
 * what it says.
 */
function mergeText(nodes: InlineNode[]): InlineNode[] {
  return nodes.reduce<InlineNode[]>((merged, node) => {
    const previous = merged.at(-1)
    if (node.type === 'text' && previous?.type === 'text') {
      return [
        ...merged.slice(0, -1),
        { type: 'text', value: previous.value + node.value },
      ]
    }
    return [...merged, node]
  }, [])
}

function parseInline(input: string): InlineNode[] {
  if (input.length === 0) return []

  const match = INLINE_PATTERN.exec(input)
  if (!match || match.index === undefined) {
    return [{ type: 'text', value: input }]
  }

  const before = input.slice(0, match.index)
  const after = input.slice(match.index + match[0].length)
  const head: InlineNode[] = before ? [{ type: 'text', value: before }] : []

  const node = ((): InlineNode => {
    if (match[3] !== undefined) {
      const href = match[3]
      const label = match[2] ?? ''
      // An unsafe href is kept as text, not dropped: the reader should still
      // see what was written, just not be able to follow it.
      if (!isSafeHref(href)) {
        return { type: 'text', value: match[0] }
      }
      return match[1] === '!'
        ? { type: 'image', href, alt: label }
        : { type: 'link', href, children: parseInline(label) }
    }
    if (match[5] !== undefined) {
      return { type: 'strong', children: parseInline(match[5]) }
    }
    if (match[7] !== undefined) {
      return { type: 'emphasis', children: parseInline(match[7]) }
    }
    return { type: 'code', value: match[8] ?? '' }
  })()

  return mergeText([...head, node, ...parseInline(after)])
}

const BULLET_PATTERN = /^\s*[-*]\s+(.*)$/
const ORDERED_PATTERN = /^\s*\d+[.)]\s+(.*)$/
const HEADING_PATTERN = /^(#{2,3})\s+(.*)$/
const QUOTE_PATTERN = /^>\s?(.*)$/

export function parseRichText(body: string): BlockNode[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: BlockNode[] = []
  let paragraph: string[] = []

  function flushParagraph(): void {
    if (paragraph.length === 0) return
    blocks.push({
      type: 'paragraph',
      children: parseInline(paragraph.join(' ')),
    })
    paragraph = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''

    if (line.trim().length === 0) {
      flushParagraph()
      continue
    }

    const heading = HEADING_PATTERN.exec(line)
    if (heading) {
      flushParagraph()
      blocks.push({
        type: 'heading',
        level: heading[1]?.length === 2 ? 2 : 3,
        children: parseInline(heading[2] ?? ''),
      })
      continue
    }

    const quote = QUOTE_PATTERN.exec(line)
    if (quote) {
      flushParagraph()
      blocks.push({ type: 'quote', children: parseInline(quote[1] ?? '') })
      continue
    }

    const isBullet = BULLET_PATTERN.test(line)
    const isOrdered = !isBullet && ORDERED_PATTERN.test(line)
    if (isBullet || isOrdered) {
      flushParagraph()
      const pattern = isBullet ? BULLET_PATTERN : ORDERED_PATTERN
      const items: InlineNode[][] = []
      // Consecutive lines of the same kind are one list. Switching kinds ends
      // it, so a bullet list followed by a numbered one stays two lists.
      while (index < lines.length) {
        const current = lines[index] ?? ''
        const item = pattern.exec(current)
        if (!item) break
        items.push(parseInline(item[1] ?? ''))
        index += 1
      }
      index -= 1
      blocks.push({ type: 'list', ordered: isOrdered, items })
      continue
    }

    paragraph.push(line.trim())
  }

  flushParagraph()
  return blocks
}

/** Plain text for excerpts, subjects, and search - never the rendered note. */
export function richTextToPlain(body: string): string {
  return body
    .replace(/!?\[([^\]]*)\]\([^)\s]+\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`|^#{2,3}\s+|^>\s?)/gm, '')
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
