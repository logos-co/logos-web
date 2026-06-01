import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { OverviewMediaPanel } from '@/components/sections/shared/overview-media-panel'

type Props = {
  data: CardGridSection
}

type Card = CardGridSection['cards'][number]

/** object-position tuned per source image so the subject stays framed. */
const IMAGE_CLASSNAMES = ['object-[50%_44%]', 'object-[50%_62%]'] as const
/** Figma alternates the row fill: grey-02 then grey-01 (node 264:15814). */
const ROW_TONES = ['gray-02', 'gray-01'] as const

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
    <div className="relative h-72 w-full overflow-hidden rounded-3xl md:h-full">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`object-cover ${IMAGE_CLASSNAMES[index] ?? ''}`}
      />
    </div>
  ) : null

  return (
    <section>
      <ContentWidth className="!p-0">
        <Reveal amount={0.2}>
          <OverviewMediaPanel
            eyebrow={card.label}
            title={card.title}
            body={card.description ? [card.description] : undefined}
            cta={card.cta}
            secondaryCta={card.secondaryCta}
            image={imagePanel}
            imagePosition={imagePosition}
            tone={ROW_TONES[index] ?? ROW_TONES[0]}
            size="compact"
          />
        </Reveal>
      </ContentWidth>
    </section>
  )
}
