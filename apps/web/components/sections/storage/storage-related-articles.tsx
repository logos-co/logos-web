import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import type { PressArticleRow } from '@/lib/press-engine'

import { ArticleCard, articlesToCards } from '../shared/related-articles-card'

const TITLE_CLASSNAME =
  'text-caption-sans flex-1 font-medium text-brand-dark-green md:text-[14px] md:leading-[1.2]'

type Props = {
  data: RelatedArticlesSection
  articles: PressArticleRow[]
}

export default function StorageRelatedArticles({ data, articles }: Props) {
  const cards =
    data.items?.map((item) => ({
      title: item.title,
      mobileTitle: item.mobileTitle,
      imageSrc: item.image.src,
      imageAlt: item.image.alt,
      imagePosition: item.imagePosition,
      date: item.date,
      author: item.author,
      href: item.href,
    })) ?? articlesToCards(articles)

  return (
    <section className="mt-15 bg-brand-off-white md:mt-25">
      <div className="mx-auto h-220 max-w-360 px-3 py-3">
        <Reveal
          amount={0.15}
          className="relative h-full overflow-hidden rounded-xl bg-accent-tan"
        >
          {data.label ? (
            <p className="text-mono-s absolute top-6 left-3 w-56.5 text-brand-dark-green">
              {data.label}
            </p>
          ) : null}
          {data.eyebrow ? (
            <p className="text-mono-s absolute top-6 left-178.5 hidden w-56.5 text-brand-dark-green md:block">
              {data.eyebrow}
            </p>
          ) : null}
          {data.cta ? (
            <div className="absolute top-5.5 right-12 md:right-[87px]">
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
            className="absolute top-60.25 right-0 left-6 flex gap-3 overflow-x-auto md:right-3 md:left-3 md:grid md:grid-cols-4 md:overflow-visible"
          >
            {cards.map((card) => (
              <RevealItem key={card.href}>
                <ArticleCard {...card} titleClassName={TITLE_CLASSNAME} />
              </RevealItem>
            ))}
          </Reveal>
        </Reveal>
      </div>
    </section>
  )
}
