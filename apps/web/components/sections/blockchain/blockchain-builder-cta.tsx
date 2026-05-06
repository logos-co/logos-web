import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { CardContent, DownloadIcon } from '../shared/builder-cta-card'

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

  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto flex max-w-360 flex-col gap-3 px-3 py-10 md:flex-row md:items-start">
        {/* Card 1: Docs — bordered, square corners, off-white bg */}
        {docsCard ? (
          <div className="flex h-75 w-full md:flex-1 flex-col items-center justify-center overflow-hidden border border-brand-dark-green p-4 md:h-125">
            <CardContent
              title={docsCard.title}
              body={docsCard.description ?? ''}
              tone="dark"
              cta={
                docsCard.cta ? (
                  <Button href={docsCard.cta.href} variant="primary">
                    {docsCard.cta.label}
                  </Button>
                ) : null
              }
            />
          </div>
        ) : null}

        {/* Card 2: Logos Builder Hub — rounded pill, blurred dark image bg */}
        {builderHubCard ? (
          <div className="relative h-75 w-full md:flex-1 overflow-hidden rounded-[200px] bg-brand-dark-green md:h-125">
            {builderHubCard.image ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <Image
                  src={builderHubCard.image.src}
                  alt={builderHubCard.image.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="scale-125 object-cover blur-2xl"
                />
              </div>
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <CardContent
                title={builderHubCard.title}
                body={builderHubCard.description ?? ''}
                tone="light"
                cta={
                  builderHubCard.cta ? (
                    <Button
                      href={builderHubCard.cta.href}
                      variant="primary"
                      className="bg-brand-off-white text-brand-dark-green"
                    >
                      {builderHubCard.cta.label}
                    </Button>
                  ) : null
                }
              />
            </div>
          </div>
        ) : null}

        {/* Card 3: Logos App — gray-01 bg, rounded */}
        {logosAppCard ? (
          <div className="flex h-75 w-full md:flex-1 flex-col items-center justify-center overflow-hidden rounded-[60px] bg-gray-01 p-4 md:h-125">
            <CardContent
              title={logosAppCard.title}
              body={logosAppCard.description ?? ''}
              tone="dark"
              cta={
                logosAppCard.cta ? (
                  <Button
                    href={logosAppCard.cta.href}
                    variant="primary"
                    icon={<DownloadIcon />}
                  >
                    {logosAppCard.cta.label}
                  </Button>
                ) : null
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
