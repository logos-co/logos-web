import type { BlogArticleDetail } from '@/lib/blog-content'
import type { BreadcrumbItem } from '@/lib/structured-data'

export interface ArticleDetailCopy {
  breadcrumb: string
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

export interface ArticleBreadcrumbProps {
  /** Parent sections shown above the title. */
  breadcrumbs: ReadonlyArray<BreadcrumbItem>
}
