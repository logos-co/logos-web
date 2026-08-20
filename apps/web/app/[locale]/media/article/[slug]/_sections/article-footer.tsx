import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'
import type {
  BlogArticleDetail,
  BlogFootnote,
  BlogPostMeta,
} from '@/lib/blog-content'

import { MediaCollapse } from '../../../_components/media-collapse'
import { ArticleDiscussion } from './article-discussion'
import type { ArticleDetailCopy } from './types'

interface ArticleFooterProps {
  article: BlogArticleDetail
  articlesFromSameAuthors: BlogPostMeta[]
  canonicalUrl: string
  copy: ArticleDetailCopy
  footnotes: BlogFootnote[]
  relatedArticles: BlogPostMeta[]
}

function formatDate(value: string | null): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function ArticleReference({ article }: { article: BlogPostMeta }) {
  return (
    <div className="border-b border-brand-dark-green px-[14px] py-3 last:border-b-0">
      <Link
        href={ROUTES.mediaArticle(article.slug)}
        className="cursor-pointer font-sans text-[16px] leading-6 hover:underline"
      >
        {article.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-sans text-[12px] leading-4">
        {article.authors.map((author) => (
          <span key={author.id || author.name}>{author.name}</span>
        ))}
        {article.authors.length > 0 && article.publishedAt ? (
          <span aria-hidden="true">•</span>
        ) : null}
        <span>{formatDate(article.publishedAt)}</span>
      </div>
    </div>
  )
}

function ReferenceCollapse({
  articles,
  label,
}: {
  articles: BlogPostMeta[]
  label: string
}) {
  if (articles.length === 0) return null

  return (
    <MediaCollapse label={label}>
      {articles.map((article) => (
        <ArticleReference key={article.id || article.slug} article={article} />
      ))}
    </MediaCollapse>
  )
}

export function ArticleFooter({
  article,
  articlesFromSameAuthors,
  canonicalUrl,
  copy,
  footnotes,
  relatedArticles,
}: ArticleFooterProps) {
  return (
    <footer className="mt-4 pb-20 max-sm:mt-[72px]">
      <div className="[&>section+section]:-mt-px">
        {footnotes.length > 0 ? (
          <MediaCollapse label={copy.footnotes}>
            {footnotes.map((footnote) => (
              <div
                key={footnote.id}
                id={`fnt-${footnote.id}`}
                className="flex gap-2 px-[14px] py-2 font-sans text-[12px] leading-4"
              >
                <a
                  href={`#${footnote.refId}`}
                  className="cursor-pointer shrink-0 underline underline-offset-2"
                >
                  {footnote.refValue}
                </a>
                <span
                  className="break-words"
                  dangerouslySetInnerHTML={{ __html: footnote.valueHTML }}
                />
              </div>
            ))}
          </MediaCollapse>
        ) : null}

        <ArticleDiscussion
          article={article}
          canonicalUrl={canonicalUrl}
          copy={copy}
        />

        <ReferenceCollapse
          label={copy.relatedArticles}
          articles={relatedArticles}
        />
        <ReferenceCollapse
          label={copy.fromSameAuthors}
          articles={articlesFromSameAuthors}
        />
      </div>
    </footer>
  )
}
