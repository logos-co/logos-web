import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import type { BlogFootnote, BlogPostMeta } from '@/lib/blog-content'

import type { ArticleDetailCopy } from './types'

interface ArticleFooterProps {
  copy: Pick<
    ArticleDetailCopy,
    'footnotes' | 'relatedArticles' | 'fromSameAuthors'
  >
  footnotes: BlogFootnote[]
  relatedArticles: BlogPostMeta[]
  articlesFromSameAuthors: BlogPostMeta[]
}

function ArticleReference({ article }: { article: BlogPostMeta }) {
  return (
    <Link
      href={ROUTES.mediaArticle(article.slug)}
      className="group grid cursor-pointer gap-3 border-t border-brand-dark-green/30 py-4 text-brand-dark-green transition-opacity hover:opacity-70 md:grid-cols-[160px_minmax(0,1fr)]"
    >
      <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
        {article.publishedAt
          ? new Intl.DateTimeFormat('en-GB', {
              timeZone: 'UTC',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(article.publishedAt))
          : ''}
      </span>
      <span className="font-sans text-[18px] font-medium leading-[1.15]">
        {article.title}
      </span>
    </Link>
  )
}

function ReferenceSection({
  title,
  articles,
}: {
  title: string
  articles: BlogPostMeta[]
}) {
  if (articles.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[36px] leading-none tracking-normal text-brand-dark-green">
        {title}
      </h2>
      <div>
        {articles.slice(0, 4).map((article) => (
          <ArticleReference key={article.slug} article={article} />
        ))}
      </div>
    </section>
  )
}

export function ArticleFooter({
  copy,
  footnotes,
  relatedArticles,
  articlesFromSameAuthors,
}: ArticleFooterProps) {
  return (
    <div className="flex flex-col gap-16">
      {footnotes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[36px] leading-none tracking-normal text-brand-dark-green">
            {copy.footnotes}
          </h2>
          <ol className="flex list-decimal flex-col gap-3 pl-5 font-sans text-[14px] leading-[1.4] text-brand-dark-green">
            {footnotes.map((footnote) => (
              <li key={footnote.id} id={`fnt-${footnote.id}`}>
                <span
                  dangerouslySetInnerHTML={{ __html: footnote.valueHTML }}
                />{' '}
                <a
                  href={`#${footnote.refId}`}
                  className="cursor-pointer underline underline-offset-2"
                >
                  {footnote.refValue}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <ReferenceSection
        title={copy.relatedArticles}
        articles={relatedArticles}
      />
      <ReferenceSection
        title={copy.fromSameAuthors}
        articles={articlesFromSameAuthors}
      />
    </div>
  )
}
