import Image from 'next/image'

import type { CardGridSection, CTA } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

/**
 * Dot accent colors are positional — Figma has three fixed accent dots in
 * mix-net / capability-discovery / peering order. Editors managing this
 * section keep the slot order stable; reordering would mismatch each card's
 * title with its accent.
 */
const DOT_CLASSNAMES = [
  'bg-accent-light-blue',
  'bg-brand-yellow',
  'bg-accent-steel-teal',
]

/**
 * Focal points are positional too — the shipped photos are portrait (4:5)
 * while the card frame is landscape, so the default 50% crop pushes each
 * photo's subject (setting sun / desk worker / hummingbird) off-center.
 * These vertical object-positions keep the subject centered in the crop.
 */
const IMAGE_POSITION_CLASSNAMES = [
  'object-[50%_62%]',
  'object-[50%_40%]',
  'object-[50%_72%]',
]

type FeatureCardProps = {
  title: string
  body: string
  dotClassName: string
  imagePositionClassName: string
  imageSrc: string
  imageAlt: string
  cta?: CTA
  secondaryCta?: CTA
}

function FeatureCard({
  title,
  body,
  dotClassName,
  imagePositionClassName,
  imageSrc,
  imageAlt,
  cta,
  secondaryCta,
}: FeatureCardProps) {
  return (
    <article className="flex min-h-[358px] w-full shrink-0 flex-col items-start justify-between rounded-3xl bg-gray-01 p-1.5 md:h-full md:min-h-[396px]">
      <div className="flex w-full flex-col gap-3 p-3">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-[18px] shrink-0 rounded-full ${dotClassName}`}
            aria-hidden="true"
          />
          <p className="text-body-sans whitespace-nowrap text-brand-dark-green">
            {title}
          </p>
        </div>
        <p className="text-mono-s text-brand-dark-green">{body}</p>
      </div>
      <div className="flex w-full flex-col">
        {cta || secondaryCta ? (
          <div className="flex items-baseline gap-1.5 px-3 pb-3">
            {cta ? (
              <Button
                href={cta.href}
                variant={cta.variant ?? 'primary'}
                className="cursor-pointer"
              >
                {cta.label}
              </Button>
            ) : null}
            {secondaryCta ? (
              <Button
                href={secondaryCta.href}
                variant={secondaryCta.variant ?? 'secondary'}
                className="cursor-pointer"
              >
                {secondaryCta.label}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="relative h-[202px] w-full overflow-hidden rounded-[18px] md:h-62">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className={`object-cover ${imagePositionClassName}`}
          />
        </div>
      </div>
    </article>
  )
}

type Props = {
  data: CardGridSection
}

export default function NetworkingFeatures({ data }: Props) {
  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto max-w-360 px-3">
        <Reveal
          stagger
          amount={0.15}
          className="flex flex-col gap-3 md:flex-row md:items-stretch"
        >
          {data.cards.map((card, index) =>
            card.image ? (
              <RevealItem key={card.title} className="md:flex-1">
                <FeatureCard
                  title={card.title}
                  body={card.description ?? ''}
                  dotClassName={DOT_CLASSNAMES[index] ?? DOT_CLASSNAMES[0]}
                  imagePositionClassName={
                    IMAGE_POSITION_CLASSNAMES[index] ?? 'object-center'
                  }
                  imageSrc={card.image.src}
                  imageAlt={card.image.alt}
                  cta={card.cta}
                  secondaryCta={card.secondaryCta}
                />
              </RevealItem>
            ) : null
          )}
        </Reveal>
      </div>
    </section>
  )
}
