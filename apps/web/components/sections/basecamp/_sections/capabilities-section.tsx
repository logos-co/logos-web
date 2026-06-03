import type { CardGridSection } from '@repo/content/schemas'

import { BasecampCta } from './atoms'

function CapabilityCard({ card }: { card: CardGridSection['cards'][number] }) {
  return (
    <article className="flex min-h-[250px] flex-col justify-between rounded-xl bg-gray-01 p-4">
      <div className="grid gap-4">
        <h3 className="font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
          {card.title}
        </h3>
        {card.description ? (
          <p className="max-w-[329px] font-sans text-[14px] leading-[1.2] text-brand-dark-green">
            {card.description}
          </p>
        ) : null}
      </div>
      {card.cta ? (
        <BasecampCta cta={card.cta} className="w-fit cursor-pointer" />
      ) : null}
    </article>
  )
}

export function CapabilitiesSection({ data }: { data: CardGridSection }) {
  return (
    <section className="w-full px-3 pt-0 pb-[60px] md:pt-0 md:pb-[180px]">
      {data.heading ? (
        <h2 className="mb-12 font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
          {data.heading}
        </h2>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {data.cards.map((card) => (
          <CapabilityCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  )
}
