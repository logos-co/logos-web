import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { CardContent, DownloadIcon } from '../shared/builder-cta-card'

type Props = {
  data: CardGridSection
}

/**
 * Same positional 3-card pattern as the blockchain / storage builder CTAs:
 *   cards[0] → Docs       (bordered, square, off-white)
 *   cards[1] → Builder Hub (rounded pill, blurred image bg)
 *   cards[2] → Logos App   (gray-01, rounded, download icon)
 */
export default function NetworkingBuilderCta({ data }: Props) {
  const [docsCard, builderHubCard, logosAppCard] = data.cards

  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto flex max-w-360 flex-col gap-3 px-3 py-10 md:flex-row md:items-start">
        {docsCard ? (
          <div className="flex h-75 w-full flex-1 flex-col items-center justify-center overflow-hidden border border-brand-dark-green p-4 md:h-125">
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

        {builderHubCard ? (
          <div className="relative h-75 w-full flex-1 overflow-hidden rounded-[200px] md:h-125">
            {builderHubCard.image ? (
              <Image
                src={builderHubCard.image.src}
                alt={builderHubCard.image.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="scale-110 object-cover blur-[20px]"
              />
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

        {logosAppCard ? (
          <div className="flex h-75 w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[60px] bg-gray-01 p-4 md:h-125">
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
