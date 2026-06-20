import type { CardGridSection } from '@repo/content/schemas'

export interface TechOverviewUseCaseCard {
  title: string
  description: string
  href: string
  ctaLabel: string
  imageSrc: string
  imageAlt: string
  imageClassName: string
}

export interface TechOverviewUseCasesScrollMetrics {
  scrollWidth: number
  clientWidth: number
}

const CARD_IMAGE_CLASSNAMES = [
  'h-[120px] w-24',
  'h-[77px] w-24',
  'h-[119px] w-24',
  'h-[127px] w-24',
]

export function getTechOverviewUseCaseCards(
  cards: Readonly<CardGridSection['cards']>
): TechOverviewUseCaseCard[] {
  return cards.flatMap((card, index) =>
    card.image && card.cta
      ? [
          {
            title: card.title,
            description: card.description ?? '',
            href: card.cta.href,
            ctaLabel: card.cta.label,
            imageSrc: card.image.src,
            imageAlt: card.image.alt || card.title,
            imageClassName:
              CARD_IMAGE_CLASSNAMES[index] ?? CARD_IMAGE_CLASSNAMES[0],
          },
        ]
      : []
    )
}

export function isTechOverviewUseCasesScrollable({
  scrollWidth,
  clientWidth,
}: TechOverviewUseCasesScrollMetrics): boolean {
  return scrollWidth > clientWidth + 1
}

export function getTechOverviewUseCasesInitialScrollLeft(): number {
  return 0
}
