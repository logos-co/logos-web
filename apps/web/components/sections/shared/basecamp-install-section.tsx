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
  ctas?: readonly {
    label: string
    href: string
    external?: boolean
  }[]
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
    image.src === '/images/builders-hub/basecamp-package-manager.webp'
  const isNodeCli = image.src === '/images/builders-hub/node-cli-card.png'

  return (
    <div className="relative h-[314px] overflow-hidden rounded-md md:h-full">
      {isPackageManager ? (
        // Anchored top-left so the image never scales up to recrop: the left
        // edge and the top border always stay visible, and a too-narrow frame
        // simply clips the image from the right (and any excess from the
        // bottom) rather than zooming in.
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-left-top"
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
  const primaryCta = card.ctas?.[0]
  const isExternal =
    primaryCta?.external || primaryCta?.href.startsWith('https://')

  const cardContent = (
    <>
      {card.image ? (
        <div className="md:h-[313px]">
          <CardImage image={card.image} imageFit={card.imageFit} />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h3 className="text-subhead-sans">{card.title}</h3>
        <p className="w-[338px] max-w-full text-mono-s">{card.description}</p>
      </div>
    </>
  )

  if (primaryCta) {
    return (
      <a
        href={primaryCta.href}
        className="flex h-[458px] cursor-pointer flex-col gap-1.5 overflow-hidden rounded-xl bg-gray-01 p-1.5 transition-[background-color,box-shadow] duration-200 ease-out hover:bg-brand-dark-green/5 hover:ring-1 hover:ring-inset hover:ring-brand-dark-green/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green md:h-[589px]"
        aria-label={primaryCta.label}
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {cardContent}
      </a>
    )
  }

  return (
    <article className="flex h-[458px] flex-col gap-1.5 overflow-hidden rounded-xl bg-gray-01 p-1.5 md:h-[589px]">
      {cardContent}
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
    <section id={id} className="border-t border-brand-dark-green/10 pt-6 pb-25">
      <ContentWidth>
        <h2 className="flex items-baseline gap-3 text-[24px] leading-[1.1] tracking-[-0.24px] whitespace-nowrap">
          <span className="font-display text-brand-dark-green/50">{index}</span>
          <span className="font-sans text-brand-dark-green">{title}</span>
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {cards.map((card) => (
            <BasecampInstallCard key={card.title} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
