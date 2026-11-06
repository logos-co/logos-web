import type { BlogDynamicCodeBlock } from '@/lib/media-blocks/types'

interface CodeBlockProps {
  block: BlogDynamicCodeBlock
}

export function CodeBlock({ block }: CodeBlockProps) {
  return (
    <pre>
      <code className={block.language ? `language-${block.language}` : ''}>
        {block.code}
      </code>
    </pre>
  )
}
