import Image from 'next/image'

import {
  TechBuilderCtaDeck,
  type TechBuilderCtaCard,
} from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

import { DownloadIcon } from '../shared/builder-cta-card'

type Props = {
  data: CardGridSection
}

/**
 * Three positional card variants on the blockchain page builder CTA section:
 *   cards[0] → Docs       (bordered, square corners, off-white bg)
 *   cards[1] → Builder Hub (rounded pill, blurred dark image bg)
 *   cards[2] → Logos App   (gray-01 bg, rounded, download icon)
 *
 * The visual treatments are positional rather than data-driven. Editors
 * managing this section should keep the slot order stable; reordering would
 * mismatch each card's title with its style. A future iteration could move
 * variant onto the card itself (e.g. as a `style` field) — out of scope for
 * the current cardGrid schema.
 */
export default function BlockchainBuilderCta({ data }: Props) {
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
      <TechBuilderCtaDeck cards={cards} />
    </Reveal>
  )
}
