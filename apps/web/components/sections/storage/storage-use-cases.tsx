import Image from 'next/image'

import { TechUseCaseGrid, type TechUseCaseCard } from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

const CARD_IMAGES = [
  {
    src: '/images/storage/use-case-figma-1.webp',
    className: 'rotate-90 scale-[1.78] object-cover blur-[20px]',
  },
  {
    src: '/images/storage/use-case-figma-2.webp',
    className: 'scale-[1.55] object-cover blur-[20px]',
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
        <Button
          href={card.cta.href}
          variant="primary"
          className="cursor-pointer bg-brand-off-white text-brand-dark-green hover:bg-brand-off-white/90"
        >
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
      <TechUseCaseGrid
        cards={cards}
        className="h-auto md:h-[362px]"
        gridClassName="pt-10 md:pt-0"
        cardClassName="rounded-xl"
      />
    </Reveal>
  )
}
