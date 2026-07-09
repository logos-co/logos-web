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
    <div className="bg-accent-tan pt-[100px] text-brand-dark-green">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 px-4 pb-24 lg:grid-cols-12 lg:gap-4">
        <ArticleSidebar
          contentsLabel={copy.contents}
          title={article.title}
          toc={article.toc}
        />
        <article className="flex min-w-0 max-w-[700px] flex-col gap-4 lg:col-span-8 lg:col-start-5">
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
            article={article}
            canonicalUrl={canonicalUrl}
          />
        </article>
      </div>
    </div>
  )
}
