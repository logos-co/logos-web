import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'

type Props = {
  data: CardGridSection
}

const IMAGE_CLASSNAMES = ['object-[50%_44%]', 'object-[50%_62%]'] as const

export default function StorageAccess({ data }: Props) {
  const [moduleCard, libraryCard] = data.cards

  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto max-w-360">
        {moduleCard ? (
          <FeatureRow card={moduleCard} imagePosition="right" index={0} />
        ) : null}
        {libraryCard ? (
          <FeatureRow card={libraryCard} imagePosition="left" index={1} />
        ) : null}
      </div>
    </section>
  )
}

function FeatureRow({
  card,
  imagePosition,
  index,
}: {
  card: CardGridSection['cards'][number]
  imagePosition: 'left' | 'right'
  index: number
}) {
  const image = card.image
  const imagePanel = image ? (
    <RevealItem className="relative h-[335px] overflow-hidden rounded-xl md:w-178.5">
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
    <RevealItem className="relative flex min-h-[335px] flex-col justify-center px-3 py-10 text-brand-dark-green md:w-178.5 md:px-0">
      {card.label ? (
        <p className="text-mono-s absolute top-0 left-0 hidden w-73.5 md:block">
          {card.label}
        </p>
      ) : null}
      <div className="max-w-121.25">
        <h2 className="text-h4-sans">{card.title}</h2>
        {card.description ? (
          <p className="text-mono-s mt-3">{card.description}</p>
        ) : null}
      </div>
      {card.footerLabel ? (
        <p className="text-mono-s absolute bottom-0 left-0 hidden w-73.5 md:block">
          {card.footerLabel}
        </p>
      ) : null}
    </RevealItem>
  )

  return (
    <Reveal
      stagger
      amount={0.2}
      className="grid gap-3 border-brand-dark-green/10 px-3 py-3 md:grid-cols-2"
    >
      {imagePosition === 'left' ? imagePanel : copyPanel}
      {imagePosition === 'left' ? copyPanel : imagePanel}
    </Reveal>
  )
}
