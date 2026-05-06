import type { PressArticle } from '@repo/content/loaders'
import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui'

import { ArticleCard, articlesToCards } from '../shared/related-articles-card'

const TITLE_CLASSNAME =
  'font-sans text-[12px] leading-[1.2] font-medium text-brand-dark-green md:text-[14px]'

type Props = {
  data: RelatedArticlesSection
  articles: PressArticle[]
}

export default function MessagingRelatedArticles({ data, articles }: Props) {
  const cards = articlesToCards(articles)

  return (
    <section className="bg-brand-off-white md:mt-0">
      <div className="mx-auto max-w-360 px-3 py-3 md:pb-0">
        <div className="relative h-220 overflow-hidden rounded-xl bg-accent-tan px-3 pt-6">
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
                  variant="link"
                  icon={<ButtonArrowIcon />}
                  className="cursor-pointer transition-opacity hover:opacity-70"
                >
                  {data.cta.label}
                </Button>
              </div>
            ) : null}
          </div>

          <h2 className="text-h3-serif mt-16.25 text-center whitespace-nowrap text-brand-dark-green">
            {data.title}
          </h2>

          <div className="mt-27.75 flex gap-3 overflow-x-auto md:grid md:grid-cols-4 md:overflow-visible">
            {cards.map((card) => (
              <ArticleCard
                key={card.href}
                {...card}
                titleClassName={TITLE_CLASSNAME}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
