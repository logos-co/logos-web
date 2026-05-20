import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'

/**
 * Dot accent colors are positional — Figma has three fixed accent dots in
 * mix-net / capability-discovery / peering order. Editors managing this
 * section keep the slot order stable; reordering would mismatch each card's
 * title with its accent.
 */
const DOT_CLASSNAMES = [
  'bg-accent-light-blue',
  'bg-brand-yellow',
  'bg-accent-steel-teal',
]

type FeatureCardProps = {
  title: string
  body: string
  dotClassName: string
  imageSrc: string
  imageAlt: string
}

function FeatureCard({
  title,
  body,
  dotClassName,
  imageSrc,
  imageAlt,
}: FeatureCardProps) {
  return (
    <article className="flex h-[358px] w-full shrink-0 flex-col items-start justify-between rounded-3xl bg-gray-01 p-1.5 md:h-[396px]">
      <div className="flex w-full flex-col gap-3 p-3">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-[18px] shrink-0 rounded-full ${dotClassName}`}
            aria-hidden="true"
          />
          <p className="text-body-sans whitespace-nowrap text-brand-dark-green">
            {title}
          </p>
        </div>
        <p className="text-mono-s text-brand-dark-green">{body}</p>
      </div>
      <div className="relative h-[202px] w-full overflow-hidden rounded-[18px] md:h-62">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
      </div>
    </article>
  )
}

type Props = {
  data: CardGridSection
}

export default function NetworkingFeatures({ data }: Props) {
  return (
    <section className="bg-brand-off-white md:mt-25">
      <div className="mx-auto max-w-360 px-3">
        <Reveal
          stagger
          amount={0.15}
          className="flex flex-col gap-3 md:flex-row md:items-stretch"
        >
          {data.cards.map((card, index) =>
            card.image ? (
              <RevealItem key={card.title} className="md:flex-1">
                <FeatureCard
                  title={card.title}
                  body={card.description ?? ''}
                  dotClassName={DOT_CLASSNAMES[index] ?? DOT_CLASSNAMES[0]}
                  imageSrc={card.image.src}
                  imageAlt={card.image.alt}
                />
              </RevealItem>
            ) : null
          )}
        </Reveal>
      </div>
    </section>
  )
}
