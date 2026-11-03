import { MediaRichContent } from '../../../_components/media-rich-content'
import { TweetEnhancement } from '../../../_components/tweet-enhancement'
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
    <>
      <MediaRichContent
        bodyHtml={article.bodyHtml}
        blocks={article.blocks}
        content={contentBlocks(article)}
      />
      {article.bodyHtml?.includes('class="twitter-tweet"') ? (
        <TweetEnhancement slug={article.slug} />
      ) : null}
    </>
  )
}
