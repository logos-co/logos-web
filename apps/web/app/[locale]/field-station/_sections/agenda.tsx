import ContentWidth from '@/components/layout/content-width'
import { UseCaseCard } from '@/components/sections/technology-stack/tech-overview-use-cases'
import { DragScroll } from '@/components/ui'
import { CARD_IMAGE_CLASSNAMES } from '@/lib/technology-stack-use-cases'

import { AGENDA } from '../_content'
import { SectionHeading } from './atoms'

/**
 * Two rows of four at desktop, as in Figma. The cards are a fixed 345px wide,
 * so narrower screens get the same drag-scroll row the homepage use cases use
 * instead of an eight-card stack.
 */
export function Agenda() {
  return (
    <section className="mt-28">
      <ContentWidth className="!px-0">
        <SectionHeading className="px-3">{AGENDA.heading}</SectionHeading>
        <DragScroll className="desktop:grid desktop:grid-cols-4 desktop:gap-y-2.5 desktop:cursor-auto desktop:overflow-visible mt-10.5 flex cursor-pointer snap-x snap-mandatory scroll-ps-3 gap-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {AGENDA.cards.map((card) => (
            <div key={card.title} className="shrink-0 snap-start">
              <UseCaseCard
                title={card.title}
                description={card.description}
                imageSrc={card.imageSrc}
                imageAlt=""
                imageClassName={CARD_IMAGE_CLASSNAMES[card.slot]}
              />
            </div>
          ))}
        </DragScroll>
      </ContentWidth>
    </section>
  )
}
