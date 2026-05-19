import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

const fallbackImages = [
  '/images/blockchain/overview/cryptarchia.webp',
  '/images/blockchain/overview/lez.webp',
  '/images/blockchain/overview/mantle.webp',
]

type OverviewCardProps = {
  card: CardGridSection['cards'][number]
  index: number
}

function OverviewCard({ card, index }: OverviewCardProps) {
  const imageSrc =
    card.image?.src ?? fallbackImages[index % fallbackImages.length]
  const imageAlt = card.image?.alt ?? ''

  return (
    <article className="flex min-h-101.5 w-full min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-brand-dark-green bg-brand-off-white p-3 text-brand-dark-green">
      <div className="flex items-start justify-between gap-4">
        <div className="relative h-19.25 w-24 overflow-hidden bg-gray-02">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="flex gap-1.5">
          {card.cta ? (
            <Button
              href={card.cta.href}
              variant={card.cta.variant ?? 'primary'}
              className="cursor-pointer"
            >
              {card.cta.label}
            </Button>
          ) : null}
          {card.secondaryCta ? (
            <Button
              href={card.secondaryCta.href}
              variant={card.secondaryCta.variant ?? 'secondary'}
              className="cursor-pointer"
            >
              {card.secondaryCta.label}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-53 flex-col justify-between gap-8">
        <h2 className="text-subhead-sans max-w-57 break-words whitespace-pre-line">
          {card.title}
        </h2>
        {card.description ? (
          <p className="text-mono-s min-w-0 break-words whitespace-pre-line">
            {card.description}
          </p>
        ) : null}
      </div>
    </article>
  )
}

type Props = {
  data: CardGridSection
}

export default function BlockchainCryptarchia({ data }: Props) {
  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto grid max-w-360 gap-3 px-3 pt-7.5 pb-15 md:grid-cols-3 md:pt-0 md:pb-25">
        {data.cards.map((card, index) => (
          <OverviewCard key={card.title} card={card} index={index} />
        ))}
      </div>
    </section>
  )
}
