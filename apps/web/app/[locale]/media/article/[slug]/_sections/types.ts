import type { BlogArticleDetail } from '@/lib/blog-content'

export interface ArticleDetailCopy {
  contents: string
  share: string
  copied: string
  relatedArticles: string
  fromSameAuthors: string
  footnotes: string
  minRead: string
  discussion: string
  discussionComments: string
  joinDiscussion: string
  noDiscussion: string
  readFullArticle: string
  startDiscussion: string
  viewFullDiscussion: string
}

export interface ArticleDetailSectionProps {
  article: BlogArticleDetail
  copy: ArticleDetailCopy
}
