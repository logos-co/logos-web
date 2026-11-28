import { rehype } from 'rehype'
import { describe, expect, it } from 'vitest'

import type { BlogArticleDetail } from '../blog-content'
import { sanitiseMediaArticle } from '../media-html'

const parser = rehype().data('settings', { fragment: true })
type HtmlNode = ReturnType<typeof parser.parse>['children'][number]

function text(node: HtmlNode): string {
  if (node.type === 'text') return node.value
  return 'children' in node ? node.children.map(text).join('') : ''
}

function codeText(html: string): string {
  const pre = parser
    .parse(html)
    .children.find((node) => node.type === 'element' && node.tagName === 'pre')
  if (!pre || pre.type !== 'element') throw new Error('Missing code block')
  return pre.children.map(text).join('')
}

function article(bodyHtml: string): BlogArticleDetail {
  return {
    id: 'code-example',
    slug: 'code-example',
    type: 'article',
    title: 'Code example',
    summary: '',
    publishedAt: '2026-11-28',
    modifiedAt: null,
    createdAt: null,
    tags: [],
    authors: [],
    coverImage: null,
    readingTime: 1,
    toc: [],
    footnotes: [],
    relatedArticles: [],
    articlesFromSameAuthors: [],
    bodyHtml,
  }
}

describe('media code highlighting', () => {
  it('highlights labelled TypeScript without changing generics, whitespace or escaped text', () => {
    const source =
      'const upload = async (): Promise<Response> => {\n  return fetch("/upload?a=1&b=2")\n}\n'
    const input = article(
      '<pre><code class="language-typescript">' +
        source.replaceAll('&', '&amp;').replaceAll('<', '&lt;') +
        '</code></pre>'
    )
    const result = sanitiseMediaArticle(input)

    expect(result.bodyHtml).toContain('hljs-keyword')
    expect(result.bodyHtml).toContain('hljs-string')
    expect(codeText(result.bodyHtml!)).toBe(source)
    expect(input.bodyHtml).not.toContain('hljs-')
  })

  it('detects unlabelled code from migrated articles', () => {
    const source =
      '// Send a file message\nconst sendFileMessage = async (fileId: string) => {\n  return true;\n}\n'
    const result = sanitiseMediaArticle(
      article(`<pre><code>${source}</code></pre>`)
    )

    expect(result.bodyHtml).toContain('hljs-comment')
    expect(result.bodyHtml).toContain('hljs-keyword')
    expect(codeText(result.bodyHtml!)).toBe(source)
  })

  it.each(['language-plaintext', 'no-highlight', 'nohighlight'])(
    'respects %s and leaves inline code untouched',
    (className) => {
      const result = sanitiseMediaArticle(
        article(
          `<pre><code class="${className}">const value = true;</code></pre>` +
            '<p>Use <code>const value = true;</code> inline.</p>'
        )
      )

      expect(result.bodyHtml).not.toContain('hljs-')
      expect(result.bodyHtml).toContain(
        '<p>Use <code>const value = true;</code> inline.</p>'
      )
    }
  )

  it('keeps unsupported languages readable without failing the article', () => {
    const result = sanitiseMediaArticle(
      article(
        '<pre><code class="language-unknown">opaque &lt;T&gt; &amp; value</code></pre>'
      )
    )
    expect(codeText(result.bodyHtml!)).toBe('opaque <T> & value')
  })

  it('replaces untrusted token markup and remains stable when a snapshot is sanitised again', () => {
    const input = article(
      '<pre><code class="lang-ts" onclick="alert(1)">' +
        '<span class="hljs-string" style="color:red">const count: number = 1;</span>' +
        '</code></pre><script>alert(1)</script>'
    )
    const result = sanitiseMediaArticle(input)

    expect(result.bodyHtml).not.toMatch(/onclick|style=|<script/)
    expect(result.bodyHtml).toContain('hljs-keyword')
    expect(codeText(result.bodyHtml!)).toBe('const count: number = 1;')
    expect(sanitiseMediaArticle(result)).toEqual(result)
  })

  it('prepares structured CMS code blocks as escaped highlighted HTML on the server', () => {
    const code = 'const message: string = "<script>alert(1)</script>";\n'
    const block = {
      type: 'code-block' as const,
      language: 'typescript',
      code,
      highlightedHtml: '<script>untrusted()</script>',
    }
    const input = { ...article(''), blocks: [block] }
    const result = sanitiseMediaArticle(input)
    const output = result.blocks?.[0]

    expect(output?.type).toBe('code-block')
    if (output?.type !== 'code-block') throw new Error('Missing code block')
    expect(output.code).toBe(code)
    expect(output.highlightedHtml).toContain('hljs-keyword')
    expect(output.highlightedHtml).not.toContain('<script>')
    expect(codeText(output.highlightedHtml!)).toBe(code)
    expect(block.highlightedHtml).toBe('<script>untrusted()</script>')
    expect(sanitiseMediaArticle(result)).toEqual(result)
  })
})
