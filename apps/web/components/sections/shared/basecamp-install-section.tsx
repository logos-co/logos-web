import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

interface BasecampInstallCardImage {
  src: string
  alt: string
  width?: number
  height?: number
}

export interface BasecampInstallCardData {
  title: string
  description: string
  image?: BasecampInstallCardImage
  imageFit?: 'cover' | 'contain'
}

interface BasecampInstallSectionProps {
  id: string
  index: string
  title: string
  cards: readonly BasecampInstallCardData[]
}

function CardImage({
  image,
  imageFit,
}: {
  image: BasecampInstallCardImage
  imageFit?: 'cover' | 'contain'
}) {
  const isPackageManager =
    image.src === '/images/builders-hub/basecamp-package-manager.png'
  const isNodeCli = image.src === '/images/builders-hub/node-cli-card.png'

  return (
    <div className="relative h-[314px] overflow-hidden rounded-md md:h-full">
      {isPackageManager ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width ?? 1}
          height={image.height ?? 1}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="absolute left-0 top-0 h-full w-auto max-w-none object-cover md:top-[-4.29%] md:h-[124.76%] md:w-full"
        />
      ) : (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className={
            imageFit === 'contain'
              ? 'object-contain'
              : `object-cover ${isNodeCli ? 'object-left' : 'object-center'}`
          }
        />
      )}
    </div>
  )
}

function BasecampInstallCard({ card }: { card: BasecampInstallCardData }) {
  return (
    <article className="flex h-[458px] flex-col gap-1.5 overflow-hidden rounded-xl bg-gray-01 p-1.5 md:h-[589px]">
      {card.image ? (
        <div className="md:h-[313px]">
          <CardImage image={card.image} imageFit={card.imageFit} />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h3 className="text-subhead-sans">{card.title}</h3>
        <p className="w-[338px] max-w-full text-mono-s">{card.description}</p>
      </div>
    </article>
  )
}

export function BasecampInstallSection({
  id,
  index,
  title,
  cards,
}: BasecampInstallSectionProps) {
  return (
    <section
      id={id}
      className="border-t border-brand-dark-green/10 px-3 pt-6 pb-25"
    >
      <ContentWidth>
        <div className="flex items-baseline gap-3 whitespace-nowrap">
          <span className="font-display text-[30px] leading-none tracking-[-0.03em] text-brand-dark-green/50 md:text-[36px]">
            {index}
          </span>
          <h2 className="text-[30px] leading-none tracking-[-0.02em] md:text-h3-sans">
            {title}
          </h2>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {cards.map((card) => (
            <BasecampInstallCard key={card.title} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
