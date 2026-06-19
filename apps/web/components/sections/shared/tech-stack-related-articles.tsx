'use client'

import { twMerge } from 'tailwind-merge'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button, useDragScroll } from '@/components/ui'
import type { BlogArticleRow } from '@/lib/blog-engine'
import { getTechStackRelatedArticleCards } from '@/lib/tech-stack-related-articles'

import { ArticleCard } from './related-articles-card'

// Mobile keeps the fixed 169.5px title column. In the desktop grid the column
// can narrow to ~235px (near the 1025px breakpoint), so the title must be able
// to shrink — otherwise it and the shrink-0 date/author block overflow into the
// next card. `flex-1 min-w-0` lets it shrink, `max-w` preserves the 169.5px cap.
const TITLE_CLASSNAME =
  'text-caption-sans w-[169.5px] shrink-0 font-medium text-brand-dark-green lg:w-auto lg:max-w-[169.5px] lg:min-w-0 lg:flex-1 lg:text-[14px] lg:leading-[1.2]'

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
  const dragHandlers = useDragScroll()

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
              className="mt-25 -mx-3 flex cursor-pointer gap-3 overflow-x-auto px-3 lg:absolute lg:top-60.25 lg:right-0 lg:left-0 lg:mx-0 lg:mt-0 desktop:grid desktop:grid-cols-4 desktop:cursor-auto desktop:overflow-visible"
              onPointerDown={dragHandlers.onPointerDown}
              onPointerMove={dragHandlers.onPointerMove}
              onPointerUp={dragHandlers.onPointerUp}
              onPointerCancel={dragHandlers.onPointerCancel}
              onClickCapture={dragHandlers.onClickCapture}
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
