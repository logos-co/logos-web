import Image from 'next/image'

import {
  TechBuilderCtaDeck,
  type TechBuilderCtaCard,
} from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import { DownloadIcon } from './builder-cta-card'

type Props = {
  data: CardGridSection
  className?: string
  deckClassName?: string
}

/**
 * Stretches the CTA anchor's hit area over the whole card (the card is
 * `position: relative`), so clicking anywhere in the box follows the link.
 */
const STRETCHED_LINK = "after:absolute after:inset-0 after:content-['']"
const CARD_LINK_OVERLAY = 'absolute inset-0 z-20 cursor-pointer'

function CardLinkOverlay({
  href,
  external,
}: {
  href: string
  external?: boolean
}) {
  if (external || /^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-hidden="true"
        tabIndex={-1}
        className={CARD_LINK_OVERLAY}
      />
    )
  }

  return (
    <Link
      href={href}
      aria-hidden="true"
      tabIndex={-1}
      className={CARD_LINK_OVERLAY}
    />
  )
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
          linkOverlay: docsCard.cta ? (
            <CardLinkOverlay
              href={docsCard.cta.href}
              external={docsCard.cta.external}
            />
          ) : null,
          cta: docsCard.cta ? (
            <Button
              href={docsCard.cta.href}
              variant="primary"
              className={STRETCHED_LINK}
            >
              {docsCard.cta.label}
            </Button>
          ) : null,
        }
      : undefined,
    builderHubCard
      ? {
          title: builderHubCard.title,
          description: builderHubCard.description,
          linkOverlay: builderHubCard.cta ? (
            <CardLinkOverlay
              href={builderHubCard.cta.href}
              external={builderHubCard.cta.external}
            />
          ) : null,
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
              className={`bg-brand-off-white text-brand-dark-green ${STRETCHED_LINK}`}
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
          linkOverlay: logosAppCard.cta ? (
            <CardLinkOverlay
              href={logosAppCard.cta.href}
              external={logosAppCard.cta.external}
            />
          ) : null,
          cta: logosAppCard.cta ? (
            <Button
              href={logosAppCard.cta.href}
              variant="primary"
              icon={<DownloadIcon />}
              className={STRETCHED_LINK}
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
