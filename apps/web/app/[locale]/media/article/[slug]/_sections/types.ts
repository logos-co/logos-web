import type { BlogArticleDetail } from '@/lib/blog-content'

export interface ArticleDetailCopy {
  contents: string
  share: string
  copied: string
  relatedArticles: string
  fromSameAuthors: string
  footnotes: string
  minRead: string
}

export interface ArticleDetailSectionProps {
  article: BlogArticleDetail
  copy: ArticleDetailCopy
}
