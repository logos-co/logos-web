import Image from 'next/image'

import {
  TechBuilderCtaDeck,
  type TechBuilderCtaCard,
} from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

import { DownloadIcon } from './builder-cta-card'

type Props = {
  data: CardGridSection
  className?: string
  deckClassName?: string
}

export default function TechStackBuilderCta({
  data,
  className,
  deckClassName,
}: Props) {
  const [docsCard, builderHubCard, logosAppCard] = data.cards
  const cardsInput: Array<TechBuilderCtaCard | undefined> = [
    docsCard
      ? {
          title: docsCard.title,
          description: docsCard.description,
          cta: docsCard.cta ? (
            <Button href={docsCard.cta.href} variant="primary">
              {docsCard.cta.label}
            </Button>
          ) : null,
        }
      : undefined,
    builderHubCard
      ? {
          title: builderHubCard.title,
          description: builderHubCard.description,
          image: builderHubCard.image ? (
            <Image
              src={builderHubCard.image.src}
              alt={builderHubCard.image.alt}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="scale-125 object-cover blur-2xl"
            />
          ) : null,
          cta: builderHubCard.cta ? (
            <Button
              href={builderHubCard.cta.href}
              variant="primary"
              className="bg-brand-off-white text-brand-dark-green"
            >
              {builderHubCard.cta.label}
            </Button>
          ) : null,
        }
      : undefined,
    logosAppCard
      ? {
          title: logosAppCard.title,
          description: logosAppCard.description,
          cta: logosAppCard.cta ? (
            <Button
              href={logosAppCard.cta.href}
              variant="primary"
              icon={<DownloadIcon />}
            >
              {logosAppCard.cta.label}
            </Button>
          ) : null,
        }
      : undefined,
  ]
  const cards = cardsInput.filter(
    (card): card is TechBuilderCtaCard => card !== undefined
  )

  return (
    <Reveal amount={0.2}>
      <TechBuilderCtaDeck
        cards={cards}
        className={className}
        deckClassName={deckClassName}
      />
    </Reveal>
  )
}
