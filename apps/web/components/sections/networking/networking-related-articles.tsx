import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'
import type { PressArticleRow } from '@/lib/press-engine'

import { ArticleCard, articlesToCards } from '../shared/related-articles-card'

type Props = {
  data: RelatedArticlesSection
  articles: PressArticleRow[]
}

export default function NetworkingRelatedArticles({ data, articles }: Props) {
  const cards = articlesToCards(articles)

  return (
    <section className="mt-15 bg-brand-off-white md:mt-25">
      <div className="mx-auto h-220 max-w-360 px-3 py-3">
        <div className="relative h-full overflow-hidden rounded-xl bg-accent-tan px-3 pt-6 pb-10 md:pb-14">
          {/* Header row */}
          <div className="flex items-start justify-between">
            {data.label ? (
              <p className="text-mono-s w-56.5 max-w-[50%] text-brand-dark-green">
                {data.label}
              </p>
            ) : null}
            {data.eyebrow ? (
              <p className="text-mono-s hidden w-56.5 text-center text-brand-dark-green md:block">
                {data.eyebrow}
              </p>
            ) : null}
            {data.cta ? (
              <div className="flex w-56.5 max-w-[50%] justify-end">
                <Button
                  href={data.cta.href}
                  variant="tertiary"
                  className="cursor-pointer transition-opacity hover:opacity-70"
                >
                  {data.cta.label}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Title */}
          <h2 className="text-h3-serif mt-16.25 text-center whitespace-nowrap text-brand-dark-green">
            {data.title}
          </h2>

          {/* Cards */}
          <div className="mt-17.5 flex gap-3 overflow-x-auto md:mt-[103px] md:grid md:grid-cols-4 md:overflow-visible">
            {cards.map((card) => (
              <ArticleCard key={card.href} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
