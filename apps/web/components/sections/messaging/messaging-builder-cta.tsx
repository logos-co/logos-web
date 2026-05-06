import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { DownloadIcon } from '../shared/builder-cta-card'

type CardContentProps = {
  title: string
  body: string
  cta: React.ReactNode
  tone: 'dark' | 'light'
}

function CardContent({ title, body, cta, tone }: CardContentProps) {
  const color =
    tone === 'dark' ? 'text-brand-dark-green' : 'text-brand-off-white'

  return (
    <div className="flex flex-col items-center justify-center gap-10">
      <div
        className={`flex max-w-108 flex-col items-center gap-3 text-center ${color}`}
      >
        <p className="text-subhead-sans">{title}</p>
        <p className="text-mono-s max-w-95">{body}</p>
      </div>
      {cta}
    </div>
  )
}

type Props = {
  data: CardGridSection
}

/**
 * Same positional 3-card pattern as the blockchain / storage / networking
 * builder CTAs:
 *   cards[0] → Docs       (bordered, square, off-white)
 *   cards[1] → Builder Hub (rounded pill, blurred image bg, custom layout)
 *   cards[2] → Logos App   (gray-01, rounded, download icon)
 */
export default function MessagingBuilderCta({ data }: Props) {
  const [docsCard, builderHubCard, logosAppCard] = data.cards

  return (
    <section className="mt-10 hidden bg-brand-off-white md:block">
      <div className="mx-auto flex h-145 max-w-360 items-start gap-3 px-3 py-10">
        {docsCard ? (
          <div className="flex h-125 flex-1 items-center justify-center border border-brand-dark-green">
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
          <div className="relative h-125 flex-1 overflow-hidden rounded-[200px]">
            {builderHubCard.image ? (
              <Image
                src={builderHubCard.image.src}
                alt={builderHubCard.image.alt}
                width={762}
                height={1015}
                sizes="762px"
                className="absolute top-[-441px] left-[-19px] h-[1015px] w-[762px] max-w-none object-cover blur-[20px]"
              />
            ) : null}
            <div className="absolute top-[184.5px] left-1/2 flex w-108 -translate-x-1/2 flex-col items-center justify-center gap-3 text-center text-brand-off-white">
              <p className="text-subhead-sans w-full">{builderHubCard.title}</p>
              <p className="text-mono-s w-full max-w-95">
                {builderHubCard.description ?? ''}
              </p>
            </div>
            {builderHubCard.cta ? (
              <div className="absolute top-[275.5px] left-1/2 -translate-x-1/2">
                <Button
                  href={builderHubCard.cta.href}
                  variant="primary"
                  className="bg-brand-off-white text-brand-dark-green"
                >
                  {builderHubCard.cta.label}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {logosAppCard ? (
          <div className="flex h-125 flex-1 items-center justify-center rounded-[60px] bg-gray-01">
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
