import Image from 'next/image'

import { TechUseCaseGrid, type TechUseCaseCard } from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

const CARD_IMAGES = [
  {
    src: '/images/storage/use-case-1.webp',
    className: 'object-[50%_44%]',
  },
  {
    src: '/images/storage/use-case-2.webp',
    className: 'object-[50%_62%]',
  },
] as const

type Props = {
  data: CardGridSection
}

export default function StorageUseCases({ data }: Props) {
  const cards: TechUseCaseCard[] = data.cards.map((card, index) => {
    const image = CARD_IMAGES[index]

    return {
      markerLabel: data.eyebrow ?? data.heading ?? '',
      title: card.title,
      body: card.description,
      cta: card.cta ? (
        <Button href={card.cta.href} variant="primary">
          {card.cta.label}
        </Button>
      ) : null,
      image: image ? (
        <Image
          src={image.src}
          alt={card.image?.alt ?? ''}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className={image.className}
        />
      ) : null,
    }
  })

  return (
    <Reveal amount={0.2}>
      <TechUseCaseGrid cards={cards} />
    </Reveal>
  )
}
