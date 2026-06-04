import Image from 'next/image'

import { TechCaseStudyCard } from '@acid-info/logos-ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

/**
 * Per-card image className is positional — Figma's two case study cards
 * crop their illustrations at different aspect ratios. Editors managing
 * this section keep the slot order stable; reordering would mismatch each
 * title with its illustration crop.
 */
const CARD_IMAGE_CLASSNAMES = [
  'absolute top-3 right-3 h-[66px] w-[53px] md:top-auto md:right-3 md:bottom-3 md:h-[120px] md:w-24',
  'absolute top-3 right-3 h-[52px] w-[66px] md:top-auto md:right-3 md:bottom-3 md:h-[77px] md:w-24',
]

type CaseStudyCardProps = {
  title: string
  body: string
  imageSrc: string
  imageAlt: string
  imageClassName: string
  markerLabel: string
  ctaLabel?: string
  ctaHref?: string
}

function CaseStudyCard({
  title,
  body,
  imageSrc,
  imageAlt,
  imageClassName,
  markerLabel,
  ctaLabel,
  ctaHref,
}: CaseStudyCardProps) {
  return (
    <TechCaseStudyCard
      title={title}
      body={body}
      markerLabel={markerLabel}
      href={ctaHref}
      imageClassName={imageClassName}
      cta={
        ctaLabel && ctaHref ? (
          <Button href={ctaHref} variant="primary">
            {ctaLabel}
          </Button>
        ) : null
      }
      image={
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="96px"
          className="object-cover"
        />
      }
    />
  )
}

type Props = {
  data: CardGridSection
}

export default function MessagingCaseStudies({ data }: Props) {
  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto max-w-360 px-3 pt-25 md:px-0 md:pt-25">
        <Reveal
          stagger
          className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-3 md:px-3"
        >
          {data.heading ? (
            <RevealItem>
              <h2 className="text-h4-sans text-brand-dark-green">
                {data.heading}
              </h2>
            </RevealItem>
          ) : null}
          {data.subheading ? (
            <RevealItem>
              <p className="text-mono-s text-brand-dark-green md:w-83.5">
                {data.subheading}
              </p>
            </RevealItem>
          ) : null}
        </Reveal>

        <Reveal
          stagger
          amount={0.2}
          className="mt-[60px] flex flex-col gap-3 md:mt-10 md:flex-row md:px-3"
        >
          {data.cards.map((card, index) =>
            card.image ? (
              <RevealItem key={card.title} className="md:flex-1">
                <CaseStudyCard
                  title={card.title}
                  body={card.description ?? ''}
                  imageSrc={card.image.src}
                  imageAlt={card.image.alt}
                  imageClassName={
                    CARD_IMAGE_CLASSNAMES[index] ?? CARD_IMAGE_CLASSNAMES[0]
                  }
                  markerLabel={data.eyebrow ?? data.heading ?? ''}
                  ctaLabel={card.cta?.label}
                  ctaHref={card.cta?.href}
                />
              </RevealItem>
            ) : null
          )}
        </Reveal>
      </div>
    </section>
  )
}
