import type { rehype } from 'rehype'

import {
  defaultMediaAnchorPrefix,
  mediaAnchorId,
  mediaFragmentHref,
  mediaFragmentId,
} from './media-anchors'
import { normaliseYoutubeFrameUrl } from './media-embed'

export type MediaHtmlTree = ReturnType<typeof rehype.parse>
type HtmlNode = MediaHtmlTree['children'][number]

export function mediaAnchorScope(storedPrefix: string | undefined) {
  const previousPrefix =
    storedPrefix && /^media-content-(?:[1-9]\d*-)?$/.test(storedPrefix)
      ? storedPrefix
      : undefined
  const targets = new Set<string>()

  const originalId = (id: string) =>
    previousPrefix && id.startsWith(previousPrefix)
      ? id.slice(previousPrefix.length)
      : id

  const originalTreeId = (id: string) =>
    originalId(id.slice(defaultMediaAnchorPrefix.length))

  function collect(node: HtmlNode) {
    if (node.type === 'element') {
      const { id, name } = node.properties
      if (typeof id === 'string') targets.add(originalTreeId(id))
      if (typeof name === 'string') targets.add(originalTreeId(name))
      node.children.forEach(collect)
    }
  }

  function prefix() {
    let value = defaultMediaAnchorPrefix
    for (
      let index = 1;
      [...targets].some((id) => id.startsWith(value));
      index++
    ) {
      value = `${defaultMediaAnchorPrefix}${index}-`
    }
    return value
  }

  function rewriteHref(href: string) {
    if (!href.startsWith('#')) return href
    const directive = href.indexOf(':~:')
    const hash = directive < 0 ? href : href.slice(0, directive)
    const source = [hash.slice(1), mediaFragmentId(hash)]
      .map(originalId)
      .find((id) => targets.has(id))
    if (!source) return href
    return (
      mediaFragmentHref(source) + (directive < 0 ? '' : href.slice(directive))
    )
  }

  function rewriteNode<T extends HtmlNode>(node: T, prefix: string): T[] {
    if (node.type !== 'element') return [node]

    const { id, name, href, src, headers } = node.properties
    const frameUrl =
      node.tagName === 'iframe' && typeof src === 'string'
        ? normaliseYoutubeFrameUrl(src)
        : undefined
    if (node.tagName === 'iframe' && !frameUrl) return []

    return [
      {
        ...node,
        properties: {
          ...node.properties,
          ...(typeof id === 'string'
            ? { id: mediaAnchorId(originalTreeId(id), prefix) }
            : {}),
          ...(typeof name === 'string'
            ? { name: mediaAnchorId(originalTreeId(name), prefix) }
            : {}),
          ...(typeof href === 'string' ? { href: rewriteHref(href) } : {}),
          ...(Array.isArray(headers)
            ? {
                headers: headers.map((header) => {
                  const source = originalId(String(header))
                  return targets.has(source)
                    ? mediaAnchorId(source, prefix)
                    : header
                }),
              }
            : {}),
          ...(frameUrl ? { src: frameUrl } : {}),
        },
        children: node.children.flatMap((child) => rewriteNode(child, prefix)),
      },
    ]
  }

  return {
    targets,
    collect,
    prefix,
    rewriteHref,
    rewriteTree: (tree: MediaHtmlTree, prefix: string): MediaHtmlTree => ({
      ...tree,
      children: tree.children.flatMap((node) => rewriteNode(node, prefix)),
    }),
  }
}
