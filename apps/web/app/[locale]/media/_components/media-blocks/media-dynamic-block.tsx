import type { BlogDynamicBlock } from '@/lib/media-blocks/types'

import { HtmlDocumentEmbed } from '../html-document-embed'
import { CodeBlock } from './code-block'
import { RichTextBlock } from './rich-text-block'
import { SrcDocEmbed } from './src-doc-embed'

interface MediaDynamicBlockProps {
  block: BlogDynamicBlock
  index: number
}

export function MediaDynamicBlock({ block, index }: MediaDynamicBlockProps) {
  switch (block.type) {
    case 'rich-text':
      return <RichTextBlock block={block} />
    case 'code-block':
      return <CodeBlock block={block} />
    case 'interactive-embed':
      return block.fullHtml?.trim() ? (
        <HtmlDocumentEmbed
          html={block.fullHtml}
          title={block.title}
          height={block.height}
        />
      ) : (
        <SrcDocEmbed block={block} index={index} />
      )
    default: {
      const unsupported: never = block
      throw new Error(`Unsupported media block: ${JSON.stringify(unsupported)}`)
    }
  }
}
