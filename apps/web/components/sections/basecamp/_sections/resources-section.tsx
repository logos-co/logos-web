import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { BasecampCta } from './atoms'

function ResourceCard({
  card,
  featured,
}: {
  card: CardGridSection['cards'][number]
  featured?: boolean
}) {
  const content = (
    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <h3
        className={
          featured
            ? 'text-subhead-sans text-brand-off-white'
            : 'text-subhead-sans text-brand-dark-green'
        }
      >
        {card.title}
      </h3>
      {card.description ? (
        <p
          className={
            featured
              ? 'text-mono-s max-w-[380px] text-brand-off-white'
              : 'text-mono-s max-w-[380px] text-brand-dark-green'
          }
        >
          {card.description}
        </p>
      ) : null}
      {card.cta ? (
        <BasecampCta
          cta={card.cta}
          className={
            featured
              ? 'mt-4 cursor-pointer bg-brand-off-white text-brand-dark-green'
              : 'mt-4 cursor-pointer'
          }
        />
      ) : null}
    </div>
  )

  if (featured) {
    return (
      <article className="relative min-h-[500px] overflow-hidden rounded-full bg-brand-dark-green">
        {card.image ? (
          <>
            <Image
              src={card.image.src}
              alt={card.image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 464px"
              className="scale-125 object-cover blur-[18px]"
            />
            <div className="absolute inset-0 bg-brand-dark-green/35" />
          </>
        ) : null}
        {content}
      </article>
    )
  }

  return (
    <article className="min-h-[500px] border border-brand-dark-green bg-brand-off-white first:rounded-none last:rounded-[60px] last:border-0 last:bg-gray-01">
      {content}
    </article>
  )
}

export function ResourcesSection({ data }: { data: CardGridSection }) {
  return (
    <section className="w-full gap-4 px-3 py-10 grid md:grid-cols-3">
      {data.cards.map((card, index) => (
        <ResourceCard key={card.title} card={card} featured={index === 1} />
      ))}
    </section>
  )
}
