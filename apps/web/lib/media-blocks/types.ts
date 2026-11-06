export interface BlogDynamicRichTextBlock {
  type: 'rich-text'
  body: string
}

export interface BlogDynamicCodeBlock {
  type: 'code-block'
  language?: string
  code: string
}

export interface BlogDynamicInteractiveEmbedBlock {
  type: 'interactive-embed'
  title?: string
  fullHtml?: string
  html: string
  css?: string
  js?: string
  height?: number
}

export type BlogDynamicBlock =
  | BlogDynamicRichTextBlock
  | BlogDynamicCodeBlock
  | BlogDynamicInteractiveEmbedBlock
