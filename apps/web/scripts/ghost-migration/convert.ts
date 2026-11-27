import { rehype } from 'rehype'
import type { BlogArticleDetail } from '../../lib/blog-content'
import { removeInjectedGhostLinks } from './source-cleanup'

export interface GhostPost {
  id: string
  uuid: string
  title: string
  slug: string
  html: string
  lexical: string
  status: string
  visibility: string
  published_at: string
  updated_at: string
  created_at: string
  feature_image: string
  og_image?: string | null
  twitter_image?: string | null
  feature_image_alt: string | null
  feature_image_caption: string | null
  custom_excerpt: string | null
  excerpt: string
  reading_time: number
  url: string
  codeinjection_head: string | null
  codeinjection_foot: string | null
  authors: Array<{ id: string; name: string }>
  tags: Array<{ id: string; name: string; visibility: string }>
}

const processor = rehype().data('settings', { fragment: true })
type Tree = ReturnType<typeof processor.parse>
type RootNode = Tree['children'][number]
type Node = Exclude<RootNode, { type: 'doctype' }>
const text = (node: RootNode): string =>
  node.type === 'text'
    ? node.value
    : 'children' in node
      ? node.children.map(text).join('')
      : ''

export function convertPost(
  post: GhostPost,
  destinations: ReadonlyMap<string, string>
) {
  if (post.status !== 'published' || post.visibility !== 'public')
    throw new Error(`Non-public source: ${post.slug}`)
  const rawCode = [
    ...post.html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi),
  ].map((match) => match[1]!)
  const tree = processor.parse(post.html)
  tree.children = tree.children.flatMap(removeInjectedGhostLinks)
  let codeIndex = 0
  const toc: BlogArticleDetail['toc'] = []
  const assets = new Set<string>(
    [post.feature_image, post.og_image, post.twitter_image].filter(
      (url): url is string => Boolean(url)
    )
  )
  const hasH1 = /<h1\b/i.test(post.html)
  let heading = 0
  function visit(node: RootNode): Node[] {
    if (node.type === 'doctype') return []
    if (node.type === 'text' && post.codeinjection_head?.includes('katex')) {
      // This source uses only Unicode variables, one subscript and one exponent.
      const value = node.value.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$1')
      if (value !== node.value)
        return processor
          .parse(
            value
              .replaceAll('ϕ_f', 'ϕ<sub>f</sub>')
              .replaceAll('^α', '<sup>α</sup>')
          )
          .children.filter((child): child is Node => child.type !== 'doctype')
    }
    if (node.type !== 'element') return [node]
    if (['script', 'style', 'svg'].includes(node.tagName)) return []
    if (node.tagName === 'pre') {
      const raw = rawCode[codeIndex++]!
      if (!/^\s*<code\b/i.test(raw)) {
        const decoded = processor.parse(
          `<textarea>${raw.replace(/<\/textarea/gi, '&#x3C;/textarea')}</textarea>`
        )
        const value = decoded.children.map(text).join('')
        return [
          {
            ...node,
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {},
                children: [{ type: 'text', value }],
              },
            ],
          },
        ]
      }
    }
    if (
      node.tagName === 'form' ||
      (Array.isArray(node.properties.className) &&
        node.properties.className.includes('kg-signup-card'))
    )
      return []
    if (node.tagName === 'iframe')
      return [
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['media-detail-video-frame'] },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['media-detail-video-aspect'] },
              children: [
                {
                  ...node,
                  properties: {
                    ...node.properties,
                    className: ['media-detail-video'],
                  },
                },
              ],
            },
          ],
        },
      ]
    if (/^h[1-6]$/.test(node.tagName)) {
      const originalLevel = Number(node.tagName[1])
      const level = Math.min(6, originalLevel + Number(hasH1))
      node.tagName = `h${level}`
      node.properties.id ??= `heading-${++heading}`
      toc.push({
        level,
        tag: node.tagName,
        href: `#${node.properties.id}`,
        title: text(node),
        blockIndex: toc.length,
      })
    }
    if (
      node.tagName === 'a' &&
      typeof node.properties.href === 'string' &&
      !node.properties.href.startsWith('#')
    ) {
      const url = new URL(node.properties.href, post.url)
      if (
        ['blog.nomos.tech', 'blog.codex.storage'].includes(url.hostname) &&
        url.pathname.startsWith('/content/files/')
      )
        assets.add(url.href)
      const target = destinations.get(
        url.origin + url.pathname.replace(/\/$/, '')
      )
      if (target) node.properties.href = target + url.search + url.hash
      else if (
        ['blog.nomos.tech', 'blog.codex.storage'].includes(url.hostname) &&
        url.pathname === '/'
      )
        node.properties.href = '/media/articles'
      else if (
        url.href === 'https://blog.codex.storage/what-is-depin/codex.storage'
      )
        node.properties.href = 'https://codex.storage/'
      else node.properties.href = url.href
    }
    if (node.tagName === 'img' && typeof node.properties.src === 'string') {
      const url = new URL(node.properties.src, post.url).href
      assets.add(url)
      node.properties.src = url
      delete node.properties.srcSet
      delete node.properties.sizes
    }
    node.children = node.children.flatMap(visit)
    if (node.tagName === 'table')
      return [
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['media-detail-table'] },
          children: [node],
        },
      ]
    return [node]
  }
  tree.children = tree.children.flatMap(visit)
  const body = String(processor.stringify(tree))
  const firstParagraph = tree.children.find(
    (node) => node.type === 'element' && node.tagName === 'p'
  )
  return {
    body,
    toc,
    summary:
      post.custom_excerpt ||
      (firstParagraph ? text(firstParagraph) : post.excerpt),
    assets: [...assets],
  }
}
