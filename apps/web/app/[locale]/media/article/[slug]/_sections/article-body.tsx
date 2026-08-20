import { MediaRichContent } from '../../../_components/media-rich-content'
import type { BlogArticleDetail } from '@/lib/blog-content'

interface ArticleBodyProps {
  article: BlogArticleDetail
}

function contentBlocks(article: BlogArticleDetail) {
  return (
    article.content?.filter(
      (block) =>
        block.labels.length === 0 ||
        block.labels.includes('embed') ||
        (block.labels.includes('subtitle') && block.order > 5)
    ) ?? []
  )
}

export function ArticleBody({ article }: ArticleBodyProps) {
  return (
    <MediaRichContent
      bodyHtml={article.bodyHtml}
      blocks={article.blocks}
      content={contentBlocks(article)}
    />
  )
}
