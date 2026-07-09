import { ArticleBody } from './article-body'
import { ArticleFooter } from './article-footer'
import { ArticleHero } from './article-hero'
import { ArticleSidebar } from './article-sidebar'
import type { ArticleDetailSectionProps } from './types'

interface ArticleDetailPageProps extends ArticleDetailSectionProps {
  canonicalUrl: string
}

export function ArticleDetailPage({
  article,
  copy,
  canonicalUrl,
}: ArticleDetailPageProps) {
  return (
    <div className="bg-accent-tan pt-28 text-brand-dark-green">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-3 pb-24 lg:grid-cols-[250px_minmax(0,940px)_1fr] lg:gap-[119px]">
        <ArticleSidebar contentsLabel={copy.contents} toc={article.toc} />
        <article className="flex min-w-0 flex-col gap-12">
          <ArticleHero
            article={article}
            copy={copy}
            canonicalUrl={canonicalUrl}
          />
          <ArticleBody article={article} />
          <ArticleFooter
            copy={copy}
            footnotes={article.footnotes}
            relatedArticles={article.relatedArticles}
            articlesFromSameAuthors={article.articlesFromSameAuthors}
          />
        </article>
        <div aria-hidden="true" className="hidden lg:block" />
      </div>
    </div>
  )
}
