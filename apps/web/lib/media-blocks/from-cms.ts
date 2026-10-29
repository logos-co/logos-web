import type { BlogDynamicBlock } from './types'

export interface GraphqlDynamicBlock {
  __typename?: string
  body?: string | null
  code?: string | null
  language?: string | null
  title?: string | null
  full_html?: string | null
  html?: string | null
  css?: string | null
  js?: string | null
  height?: number | null
}

export function mapGraphqlDynamicBlocks(
  blocks?: readonly GraphqlDynamicBlock[] | null
): BlogDynamicBlock[] | undefined {
  const mapped =
    blocks
      ?.map((block): BlogDynamicBlock | null => {
        if (block.__typename === 'ComponentBlocksRichText') {
          return { type: 'rich-text', body: block.body ?? '' }
        }
        if (block.__typename === 'ComponentBlocksCodeBlock') {
          return {
            type: 'code-block',
            code: block.code ?? '',
            language: block.language ?? undefined,
          }
        }
        if (block.__typename === 'ComponentBlocksInteractiveEmbed') {
          return {
            type: 'interactive-embed',
            title: block.title ?? undefined,
            fullHtml: block.full_html ?? undefined,
            html: block.html ?? '',
            css: block.css ?? undefined,
            js: block.js ?? undefined,
            height: block.height ?? undefined,
          }
        }
        return null
      })
      .filter((block): block is BlogDynamicBlock => block !== null) ?? []

  return mapped.length > 0 ? mapped : undefined
}
