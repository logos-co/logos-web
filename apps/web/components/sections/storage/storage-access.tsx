import Image from 'next/image'

import { SectionMarker } from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

type Props = {
  data: CardGridSection
}

type Card = CardGridSection['cards'][number]

/** object-position tuned per source image so the subject stays framed. */
const IMAGE_CLASSNAMES = ['object-[50%_44%]', 'object-[50%_62%]'] as const
/** Figma alternates the row fill: grey-02 then grey-01 (node 264:15814). */
const ROW_BG = ['bg-gray-02', 'bg-gray-01'] as const

function ExternalLinkIcon() {
  return <IconMask src="/icons/external-link.svg" className="size-3.75" />
}

export default function StorageAccess({ data }: Props) {
  const [moduleCard, libraryCard] = data.cards

  return (
    <>
      {moduleCard ? (
        <FeatureRow card={moduleCard} imagePosition="right" index={0} />
      ) : null}
      {libraryCard ? (
        <FeatureRow card={libraryCard} imagePosition="left" index={1} />
      ) : null}
    </>
  )
}

function FeatureRow({
  card,
  imagePosition,
  index,
}: {
  card: Card
  imagePosition: 'left' | 'right'
  index: number
}) {
  const image = card.image
  const imagePanel = image ? (
    <RevealItem className="relative h-72 w-full overflow-hidden rounded-3xl md:h-83.75">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`object-cover ${IMAGE_CLASSNAMES[index] ?? ''}`}
      />
    </RevealItem>
  ) : null

  const copyPanel = (
    <RevealItem className="flex min-h-83.75 flex-col justify-between gap-6 py-10 text-brand-dark-green md:py-0">
      {card.label ? <SectionMarker label={card.label} /> : <span aria-hidden />}

      <div className="flex flex-col gap-3">
        <h2 className="text-h4-sans md:w-84">{card.title}</h2>
        {card.description ? (
          <p className="text-caption-sans font-medium md:w-121.25">
            {card.description}
          </p>
        ) : null}
      </div>

      {card.cta || card.secondaryCta ? (
        <div className="flex items-center gap-1.5">
          {card.cta ? (
            <Button
              href={card.cta.href}
              variant={card.cta.variant ?? 'primary'}
              icon={<ExternalLinkIcon />}
              {...(card.cta.external
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              {card.cta.label}
            </Button>
          ) : null}
          {card.secondaryCta ? (
            <Button
              href={card.secondaryCta.href}
              variant={card.secondaryCta.variant ?? 'secondary'}
              {...(card.secondaryCta.external
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              {card.secondaryCta.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </RevealItem>
  )

  return (
    <section>
      <ContentWidth className={ROW_BG[index] ?? ROW_BG[0]}>
        <Reveal
          stagger
          amount={0.2}
          className="grid gap-3 md:grid-cols-2 md:items-stretch"
        >
          {imagePosition === 'left' ? imagePanel : copyPanel}
          {imagePosition === 'left' ? copyPanel : imagePanel}
        </Reveal>
      </ContentWidth>
    </section>
  )
}
