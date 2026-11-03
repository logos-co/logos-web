import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'
import { normaliseLegacyMdx } from './legacy-mdx'

export interface SourceArticle {
  sourceFile: string
  slug: string
  title: string
  publish_date: string
  authors: string[]
  tags: string[]
  cover: string
  body: string
  summary: string
  markdown_body: string
  images: string[]
  codeBlocks: string[]
}

interface HtmlNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HtmlNode[]
}

const textOf = (node: HtmlNode): string =>
  node.type === 'text'
    ? (node.value ?? '')
    : (node.children ?? []).map(textOf).join('')

export function rewriteLink(href: string, slugs: ReadonlySet<string>): string {
  const corrections: Record<string, string> = {
    'walu.org/events': 'https://waku.org/events',
    'discord.waku.org': 'https://discord.waku.org',
    'logos.co': 'https://logos.co',
    '#message-routing--sharding': '#message-routing---sharding',
  }
  if (corrections[href]) return corrections[href]
  if (href.startsWith('#')) return href
  const url = new URL(href, 'https://blog.waku.org/')
  if (url.hostname !== 'blog.waku.org') return href
  const slug = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, ''))
  if (slugs.has(slug)) return `/media/article/${slug}${url.search}${url.hash}`
  return url.href
}

export function convertArticle(
  sourceFile: string,
  source: string,
  slugs: ReadonlySet<string>,
  authorNames: Record<string, { name: string }>
): SourceArticle {
  const { data, content } = matter(source)
  const title = String(data.title)
  const slug = String(data.slug)
  const date =
    data.date instanceof Date ? data.date : new Date(String(data.date))
  if (!data.title || !data.slug || !Number.isFinite(date.getTime())) {
    throw new Error(`Missing title, slug or date: ${sourceFile}`)
  }
  const cleaned = normaliseLegacyMdx(
    content
      .replace(/^import \{ Button \} from '@acid-info\/lsd-react'\s*$/m, '')
      .replace(
        /<a href="\/es\/build-dapps-using-waku">\s*<Button>Read in Spanish<\/Button>\s*<\/a>\s*(?:<br\s*\/>\s*)*/m,
        ''
      )
      .replace(/<!--\s*truncate\s*-->/g, '')
  )
  const images = new Set<string>()
  const codeBlocks: string[] = []
  let summary = ''
  const transform = () => (tree: HtmlNode) => {
    const slugger = new GithubSlugger()
    const firstHeading = tree.children?.find((node) =>
      /^h[1-6]$/.test(node.tagName ?? '')
    )
    const isDuplicateTitle = (node: HtmlNode) =>
      node === firstHeading && textOf(node).trim() === title.trim()
    const hasH1 = (node: HtmlNode): boolean =>
      (node.tagName === 'h1' && !isDuplicateTitle(node)) ||
      (node.children ?? []).some(hasH1)
    const shiftHeadings = hasH1(tree)
    const visit = (node: HtmlNode) => {
      const props = node.properties ?? {}
      if (/^h[1-6]$/.test(node.tagName ?? '')) {
        props.id = props.id || slugger.slug(textOf(node))
        if (isDuplicateTitle(node)) {
          // The page H1 owns this title; retain the source fragment destination.
          node.tagName = 'span'
          node.children = []
        }
      }
      if (node.tagName === 'a' && typeof props.href === 'string') {
        props.href = rewriteLink(props.href, slugs)
      }
      if (node.tagName === 'img' && typeof props.src === 'string') {
        const url = new URL(props.src, 'https://blog.waku.org/')
        images.add(url.href)
        props.src = url.href
      }
      if (node.tagName === 'pre') codeBlocks.push(textOf(node))
      if (!summary && node.tagName === 'p' && textOf(node).trim()) {
        summary = textOf(node).trim()
      }
      if (shiftHeadings && /^h[1-6]$/.test(node.tagName ?? '')) {
        node.tagName = `h${Math.min(6, Number(node.tagName![1]) + 1)}`
      }
      node.children?.forEach(visit)
      if (node.children) {
        node.children = node.children.map((child) =>
          child.tagName === 'table'
            ? {
                type: 'element',
                tagName: 'div',
                properties: { className: ['media-detail-table'] },
                children: [child],
              }
            : child
        )
      }
    }
    visit(tree)
  }
  let body = renderToStaticMarkup(
    createElement(Markdown, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeRaw, transform],
      disallowedElements: ['script', 'style'],
      children: cleaned,
    })
  )
  // React's resource hints belong in the document head, not CMS article copy.
  body = body.replace(/<link\b[^>]*rel="preload"[^>]*\/>/g, '')
  if (data.discuss) {
    body += renderToStaticMarkup(
      createElement(
        'p',
        null,
        createElement(
          'a',
          { href: String(data.discuss) },
          'Discuss this article'
        )
      )
    )
  }
  const authors = (Array.isArray(data.authors) ? data.authors : [data.authors])
    .filter(Boolean)
    .map((id: string) => {
      if (!authorNames[id]) throw new Error(`Unknown author: ${id}`)
      return authorNames[id].name
    })
  const cover = new URL(
    data.image || '/img/black-waku-logo-with-name.png',
    'https://blog.waku.org/'
  ).href
  images.add(cover)
  return {
    sourceFile,
    slug,
    title,
    publish_date: date.toISOString().slice(0, 10),
    authors,
    tags: [
      ...new Set([
        'waku',
        ...String(data.categories || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ]),
    ],
    cover,
    body,
    summary,
    markdown_body: source,
    images: [...images],
    codeBlocks,
  }
}
