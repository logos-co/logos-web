import type { BlogDynamicRichTextBlock } from '@/lib/media-blocks/types'
import { prepareCmsLinks } from '@/lib/html-links'

interface RichTextBlockProps {
  block: BlogDynamicRichTextBlock
}

export function RichTextBlock({ block }: RichTextBlockProps) {
  return (
    <div
      className="contents"
      dangerouslySetInnerHTML={{ __html: prepareCmsLinks(block.body) }}
    />
  )
}
