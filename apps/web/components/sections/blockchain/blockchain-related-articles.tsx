import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import type { PressArticleRow } from '@/lib/press-engine'

import { ArticleCard, articlesToCards } from '../shared/related-articles-card'

type Props = {
  data: RelatedArticlesSection
  articles: PressArticleRow[]
}

export default function BlockchainRelatedArticles({ data, articles }: Props) {
  const cards =
    articles.length > 0
      ? articlesToCards(articles)
      : (data.items?.map((item) => ({
          title: item.title,
          mobileTitle: item.mobileTitle,
          imageSrc: item.image.src,
          imageAlt: item.image.alt,
          imagePosition: item.imagePosition,
          date: item.date,
          author: item.author,
          href: item.href,
        })) ?? [])

  return (
    <section className="bg-brand-off-white pt-15 pb-15 md:pt-[87px] md:pb-[93px]">
      <div className="mx-auto max-w-360 px-3 py-3">
        {/* Desktop: Figma-exact absolute layout (tan bg w-1416, h-856) */}
        <Reveal
          amount={0.15}
          className="relative hidden h-214 overflow-hidden rounded-xl bg-accent-tan md:block"
        >
          {data.label ? (
            <p className="text-mono-s absolute top-6 left-3 w-56.5 text-brand-dark-green">
              {data.label}
            </p>
          ) : null}
          {data.eyebrow ? (
            <p className="text-mono-s absolute top-6 left-178.5 w-56.5 text-brand-dark-green">
              {data.eyebrow}
            </p>
          ) : null}
          {data.cta ? (
            <div className="absolute top-5.5 left-297.5">
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
          <h2 className="text-h3-serif absolute top-25.5 left-1/2 w-116 -translate-x-1/2 text-center whitespace-nowrap text-brand-dark-green">
            {data.title}
          </h2>
          <Reveal
            stagger
            amount={0.2}
            className="absolute top-60.25 right-3 left-3 grid grid-cols-4 gap-3"
          >
            {cards.map((card) => (
              <RevealItem key={card.title}>
                <ArticleCard {...card} />
              </RevealItem>
            ))}
          </Reveal>
        </Reveal>

        <Reveal className="h-214 overflow-hidden rounded-xl bg-accent-tan px-3 pt-6 pb-10 md:hidden">
          <div className="flex items-start justify-between">
            {data.label ? (
              <p className="text-mono-s w-[111px] text-brand-dark-green">
                {data.mobileLabel ?? data.label}
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
          <h2 className="text-h3-serif mt-16 text-center text-brand-dark-green">
            {data.title}
          </h2>
          <Reveal stagger className="mt-8 flex gap-3 overflow-x-auto">
            {cards.map((card) => (
              <RevealItem key={card.title}>
                <ArticleCard {...card} />
              </RevealItem>
            ))}
          </Reveal>
        </Reveal>
      </div>
    </section>
  )
}
