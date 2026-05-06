import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { CardContent, DownloadIcon } from '../shared/builder-cta-card'

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

  return (
    <section className="mt-15 bg-brand-off-white md:mt-25">
      <div className="mx-auto flex max-w-360 flex-col gap-3 px-3 py-10 md:flex-row md:items-start">
        {docsCard ? (
          <div className="flex h-75 w-full flex-col items-center justify-center overflow-hidden border border-brand-dark-green p-4 md:h-125 md:flex-1">
            <CardContent
              title={docsCard.title}
              body={docsCard.description ?? ''}
              tone="dark"
              wrapperClassName={CARD_WRAPPER_CLASSNAME}
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
          <div className="relative h-75 w-full overflow-hidden rounded-[200px] bg-brand-dark-green md:h-125 md:flex-1">
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
                wrapperClassName={CARD_WRAPPER_CLASSNAME}
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
          <div className="flex h-75 w-full flex-col items-center justify-center overflow-hidden rounded-[60px] bg-gray-01 p-4 md:h-125 md:flex-1">
            <CardContent
              title={logosAppCard.title}
              body={logosAppCard.description ?? ''}
              tone="dark"
              wrapperClassName={CARD_WRAPPER_CLASSNAME}
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
