import { twMerge } from 'tailwind-merge'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import type { PressArticleRow } from '@/lib/press-engine'

import { ArticleCard, articlesToCards } from './related-articles-card'

const TITLE_CLASSNAME =
  'text-caption-sans flex-1 font-medium text-brand-dark-green md:text-[14px] md:leading-[1.2]'

type Props = {
  data: RelatedArticlesSection
  articles: PressArticleRow[]
  sectionClassName?: string
}

export default function TechStackRelatedArticles({
  data,
  articles,
  sectionClassName,
}: Props) {
  const cards =
    data.items?.map((item) => ({
      title: item.title,
      mobileTitle: item.mobileTitle,
      imageSrc: item.image.src,
      imageAlt: item.image.alt,
      imagePosition: item.imagePosition,
      date: item.date,
      author: item.author,
      readingTime: item.readingTime,
      href: item.href,
    })) ?? articlesToCards(articles)

  return (
    <section
      className={twMerge(
        'mt-15 bg-brand-off-white md:mt-25',
        sectionClassName
      )}
    >
      <div className="h-220 px-3 py-3">
        <Reveal
          amount={0.15}
          className="relative h-full overflow-hidden rounded-xl bg-accent-tan px-3 pt-6 pb-10 md:px-0 md:pt-0 md:pb-0"
        >
          <div className="flex items-start justify-between md:block">
            {data.label ? (
              <p className="text-mono-s w-56.5 max-w-[50%] text-brand-dark-green md:absolute md:top-6 md:left-3 md:max-w-none">
                {data.mobileLabel ?? data.label}
              </p>
            ) : null}
            {data.eyebrow ? (
              <p className="text-mono-s absolute top-6 left-178.5 hidden w-56.5 text-brand-dark-green md:block">
                {data.eyebrow}
              </p>
            ) : null}
            {data.cta ? (
              <div className="flex w-56.5 max-w-[50%] justify-end md:absolute md:top-5.5 md:right-[87px] md:block md:w-auto md:max-w-none">
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

          <h2 className="text-h3-serif mt-16.25 text-center whitespace-nowrap text-brand-dark-green md:absolute md:top-25.5 md:left-1/2 md:mt-0 md:w-116 md:-translate-x-1/2">
            {data.title}
          </h2>

          <Reveal
            stagger
            amount={0.2}
            className="mt-27.75 flex gap-3 overflow-x-auto md:absolute md:top-60.25 md:right-3 md:left-3 md:mt-0 md:grid md:grid-cols-4 md:overflow-visible"
          >
            {cards.map((card) => (
              <RevealItem key={`${card.href}:${card.title}`}>
                <ArticleCard {...card} titleClassName={TITLE_CLASSNAME} />
              </RevealItem>
            ))}
          </Reveal>
        </Reveal>
      </div>
    </section>
  )
}
