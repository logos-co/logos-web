import React from 'react'

type TagRenderer = (innerText: string) => React.ReactNode

/**
 * Renders a template string with non-nested XML-like tags.
 * Tags can be either:
 *   - Paired: <tag>inner text</tag>
 *   - Self-closing empty: <tag></tag> (renderer supplies its own label)
 *
 * @param template - The template string with <tag>...</tag> markup
 * @param renderers - Map of tag name -> function that receives inner text and returns ReactNode
 * @returns Array of ReactNodes (text segments and rendered tag nodes)
 */
export function renderTaggedText(
  template: string,
  renderers: Record<string, TagRenderer>
): React.ReactNode[] {
  const tagNames = Object.keys(renderers).join('|')
  const regex = new RegExp(`<(${tagNames})>(.*?)<\\/\\1>`, 'gs')

  const result: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyIdx = 0

  while ((match = regex.exec(template)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      result.push(template.slice(lastIndex, match.index))
    }

    const [, tagName, innerText] = match
    const renderer = renderers[tagName]
    if (renderer) {
      const node = renderer(innerText)
      result.push(
        React.isValidElement(node)
          ? React.cloneElement(node as React.ReactElement, { key: `tag-${keyIdx++}` })
          : node
      )
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining text after last match
  if (lastIndex < template.length) {
    result.push(template.slice(lastIndex))
  }

  return result
}
