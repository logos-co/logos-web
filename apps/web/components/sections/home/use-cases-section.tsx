'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import { BREAKPOINTS } from '@/lib/breakpoints'

const CARD_IMAGE_CLASSNAMES = [
  'h-[120px] w-24 right-[10px] bottom-[11px]',
  'h-[77px] w-24 right-[9px] bottom-[11px]',
  'h-[119px] w-24 right-[10px] bottom-[10px]',
  'h-[127px] w-24 right-[9px] bottom-[11px]',
]

function ScrollButton({
  direction,
  onClick,
}: {
  direction: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      className="flex size-10 cursor-pointer items-center justify-center rounded-[4px] bg-brand-off-white/10 text-brand-dark-green backdrop-blur-[5px] transition-colors hover:bg-brand-dark-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
    >
      <img
        src={
          direction === 'left'
            ? '/icons/arrow-left.svg'
            : '/icons/arrow-right.svg'
        }
        alt=""
        aria-hidden="true"
        className="size-[18px]"
      />
    </button>
  )
}

interface UseCaseCardProps {
  title: string
  description: string
  href: string
  ctaLabel: string
  imageSrc: string
  imageAlt: string
  imageClassName: string
}

function UseCaseCard({
  title,
  description,
  href,
  ctaLabel,
  imageSrc,
  imageAlt,
  imageClassName,
}: UseCaseCardProps) {
  return (
    <Link
      href={href}
      className="group relative h-[317px] w-[345px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-brand-dark-green/50 bg-brand-off-white transition-colors hover:bg-gray-01 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
    >
      <h4 className="text-h4-sans absolute top-2.5 left-[15px] w-[249px] text-brand-dark-green">
        {title}
      </h4>

      <div className="absolute top-[82px] left-[15px]">
        <span className="inline-flex items-center justify-center text-brand-dark-green">
          <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-[2px]">
            {ctaLabel}
          </span>
        </span>
      </div>

      <p className="text-mono-s absolute bottom-[15px] left-[15px] w-[186px] text-brand-dark-green">
        {description}
      </p>

      <div
        className={`absolute overflow-hidden bg-brand-dark-green/5 ${imageClassName}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 33vw, 96px"
          className="object-cover"
        />
      </div>
    </Link>
  )
}

type Props = {
  data: CardGridSection
}

export default function UseCasesSection({ data }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollLeft = window.innerWidth > BREAKPOINTS.lg ? 120 : 0
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -357 : 357
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  const cards = data.cards.flatMap((card, index) =>
    card.image && card.cta
      ? [
          {
            ...card,
            image: card.image,
            cta: card.cta,
            imageClassName:
              CARD_IMAGE_CLASSNAMES[index % 4] ?? CARD_IMAGE_CLASSNAMES[0],
          },
        ]
      : []
  )

  return (
    <section
      id="use-cases"
      className="relative w-full overflow-hidden bg-brand-off-white min-[1025px]:h-[816px]"
    >
      <div className="px-3 py-16 min-[1025px]:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="relative h-[81px] w-[107px] shrink-0 overflow-hidden">
            <Image
              src="/images/technology-stack/use-cases-top.jpg"
              alt=""
              fill
              sizes="107px"
              className="object-cover"
            />
          </div>
          {data.subheading ? (
            <p className="text-mono-s w-[226px] text-brand-dark-green">
              {data.subheading}
            </p>
          ) : null}
        </div>

        {data.subheadingExtra ? (
          <p className="text-mono-s mt-6 w-[226px] text-brand-dark-green">
            {data.subheadingExtra}
          </p>
        ) : null}

        {data.heading ? (
          <h2 className="text-h2 mt-16 text-center text-brand-dark-green">
            {data.heading}
          </h2>
        ) : null}

        <div className="mt-12 flex items-center justify-between">
          <div className="flex gap-2.5">
            <ScrollButton direction="left" onClick={() => scroll('left')} />
            <ScrollButton direction="right" onClick={() => scroll('right')} />
          </div>
          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="link"
              icon={false}
              className="transition-opacity hover:opacity-70"
            >
              {data.cta.label}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="hidden min-[1025px]:block">
        <div className="absolute top-6 left-3 h-[81px] w-[107px] overflow-hidden">
          <Image
            src="/images/technology-stack/use-cases-top.jpg"
            alt=""
            fill
            sizes="107px"
            className="object-cover"
          />
        </div>

        {data.subheading ? (
          <p className="text-mono-s absolute top-6 left-[calc(50%+6px)] w-[226px] text-brand-dark-green">
            {data.subheading}
          </p>
        ) : null}

        {data.subheadingExtra ? (
          <p className="text-mono-s absolute top-6 left-[calc(75%+3px)] w-[226px] text-brand-dark-green">
            {data.subheadingExtra}
          </p>
        ) : null}

        {data.heading ? (
          <h2 className="text-h2 absolute top-[140px] left-1/2 w-[464px] -translate-x-1/2 text-center text-brand-dark-green">
            {data.heading}
          </h2>
        ) : null}

        <div className="absolute top-[269px] left-3 flex gap-2.5">
          <ScrollButton direction="left" onClick={() => scroll('left')} />
          <ScrollButton direction="right" onClick={() => scroll('right')} />
        </div>

        {data.cta ? (
          <Button
            href={data.cta.href}
            variant="link"
            icon={false}
            className="absolute top-[272px] left-[calc(54.17%-15px)] -translate-x-1/2 transition-opacity hover:opacity-70"
          >
            {data.cta.label}
          </Button>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="flex w-full gap-3 overflow-x-auto px-3 pb-4 min-[1025px]:absolute min-[1025px]:top-[403px] min-[1025px]:left-0 min-[1025px]:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cards.map((card) => (
          <UseCaseCard
            key={`${card.title}-${card.cta.href}`}
            title={card.title}
            description={card.description ?? ''}
            href={card.cta.href}
            ctaLabel={card.cta.label}
            imageSrc={card.image.src}
            imageAlt={card.image.alt || card.title}
            imageClassName={card.imageClassName}
          />
        ))}
      </div>
    </section>
  )
}
