import Image from 'next/image'

import {
  TechBuilderCtaDeck,
  type TechBuilderCtaCard,
} from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

import { DownloadIcon } from '../shared/builder-cta-card'

const CARD_WRAPPER_CLASSNAME =
  'flex flex-col items-center justify-center gap-6 md:gap-10'

type Props = {
  data: CardGridSection
}

/**
 * Same positional 3-card pattern as the blockchain page's builder CTA:
 *   cards[0] → Docs       (bordered, square, off-white)
 *   cards[1] → Builder Hub (rounded pill, blurred image bg, dark green)
 *   cards[2] → Logos App   (gray-01, rounded, download icon)
 */
export default function StorageBuilderCta({ data }: Props) {
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
        className="mt-15 mb-15 md:mt-25 md:mb-25"
        contentWrapperClassName={CARD_WRAPPER_CLASSNAME}
      />
    </Reveal>
  )
}
