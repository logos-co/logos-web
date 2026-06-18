import { twMerge } from 'tailwind-merge'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui'
import type { BlogArticleRow } from '@/lib/blog-engine'
import { getTechStackRelatedArticleCards } from '@/lib/tech-stack-related-articles'

import { ArticleCard } from './related-articles-card'

const TITLE_CLASSNAME =
  'text-caption-sans w-[169.5px] shrink-0 font-medium text-brand-dark-green lg:text-[14px] lg:leading-[1.2]'

type Props = {
  data: RelatedArticlesSection
  articles: BlogArticleRow[]
  sectionClassName?: string
  /** No top padding — gap to the section above comes from the explorer `pb-18` (72px). */
  contentClassName?: string
}

export default function TechStackRelatedArticles({
  data,
  articles,
  sectionClassName,
  contentClassName,
}: Props) {
  const cards = getTechStackRelatedArticleCards(data, articles)

  return (
    <section className={twMerge('mt-15 md:mt-25', sectionClassName)}>
      <div className="bg-brand-off-white">
        <ContentWidth
          className={twMerge('h-220 px-3 pb-3 pt-0', contentClassName)}
        >
          <Reveal
            amount={0.15}
            className="relative h-full overflow-hidden rounded-xl bg-accent-tan px-3 pt-6 pb-10 lg:px-0 lg:pt-0 lg:pb-0"
          >
            <div className="flex items-start justify-between lg:block">
              {data.label ? (
                <p className="text-mono-s w-56.5 max-w-[50%] text-brand-dark-green lg:absolute lg:top-6 lg:left-3 lg:max-w-none">
                  {data.mobileLabel ?? data.label}
                </p>
              ) : null}
              {data.eyebrow ? (
                // xl, not lg: the fixed left-178.5 offset collides with the
                // right-anchored CTA on viewports narrower than ~1190px.
                <p className="text-mono-s absolute top-6 left-178.5 hidden w-56.5 text-brand-dark-green xl:block">
                  {data.eyebrow}
                </p>
              ) : null}
              {data.cta ? (
                <div className="flex w-56.5 max-w-[50%] justify-end lg:absolute lg:top-5.5 lg:right-[87px] lg:block lg:w-auto lg:max-w-none">
                  <Button
                    href={data.cta.href}
                    variant="tertiary"
                    className="cursor-pointer"
                  >
                    {data.cta.label}
                  </Button>
                </div>
              ) : null}
            </div>

            <h2 className="mt-16.25 text-center font-display text-[40px] leading-none tracking-[-0.03em] whitespace-nowrap text-brand-dark-green lg:absolute lg:top-25.5 lg:left-1/2 lg:mt-0 lg:w-116 lg:-translate-x-1/2 lg:text-h3-serif">
              {data.title}
            </h2>

            <Reveal
              stagger
              amount={0.2}
              className="mt-25 flex gap-3 overflow-x-auto lg:absolute lg:top-60.25 lg:right-3 lg:left-3 lg:mt-0 lg:grid lg:grid-cols-4 lg:overflow-visible"
            >
              {cards.map((card) => (
                <RevealItem key={`${card.href}:${card.title}`}>
                  <ArticleCard {...card} titleClassName={TITLE_CLASSNAME} />
                </RevealItem>
              ))}
            </Reveal>
          </Reveal>
        </ContentWidth>
      </div>
    </section>
  )
}
