import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

import { DEEPER_DIVES } from '../_content'
import { TRIM } from './atoms'

/**
 * Figma fixes this frame at 596px with 24px above and 100px below, and
 * centres the content in what is left.
 */
export function DeeperDives() {
  return (
    <section className="flex flex-col border-t border-brand-dark-green/10 bg-gray-01 py-16 text-brand-dark-green lg:min-h-[596px] lg:justify-center lg:pt-6 lg:pb-[100px]">
      <ContentWidth className="flex w-full flex-col gap-10">
        <h2 className="text-h4-sans">{DEEPER_DIVES.heading}</h2>
        <div className="flex flex-col gap-3 lg:flex-row">
          {DEEPER_DIVES.cards.map((card) => (
            <article
              key={card.title}
              className="flex min-h-[250px] min-w-0 flex-1 flex-col items-start justify-between gap-10 overflow-clip rounded-xl bg-gray-02 p-4"
            >
              <div className="flex flex-col gap-6">
                <h3 className="text-h4-sans">{card.title}</h3>
                <div className="text-body-sans flex flex-col gap-6">
                  <p
                    className={`font-bold lg:max-w-[329px] lg:whitespace-pre-line ${TRIM}`}
                  >
                    {card.subtitle}
                  </p>
                  <p
                    className={`lg:max-w-[329px] lg:whitespace-pre-line ${TRIM}`}
                  >
                    {card.body}
                  </p>
                </div>
              </div>
              <Button href={card.href} className="cursor-pointer">
                {card.cta}
              </Button>
            </article>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
