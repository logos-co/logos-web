'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

type UseCaseCardData = {
  title: string
  description: string
  href: string
  ctaLabel: string
  imageSrc: string
  imageAlt: string
  imageClassName: string
}

/**
 * Per-card image className is positional — Figma renders the four use-case
 * cards with different image aspect crops. Editors keep the slot order
 * stable; reordering would shuffle the aspects.
 */
const CARD_IMAGE_CLASSNAMES = [
  'h-[120px] w-24',
  'h-[77px] w-24',
  'h-[119px] w-24',
  'h-[127px] w-24',
]

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <IconMask
      src={
        direction === 'left'
          ? '/icons/arrow-left.svg'
          : '/icons/arrow-right.svg'
      }
      className="size-3.5"
    />
  )
}

function ScrollControl({
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
      className="bg-brand-off-white/10 inline-flex size-10 cursor-pointer items-center justify-center rounded-[4px] text-brand-dark-green backdrop-blur-[5px] transition-opacity hover:opacity-70"
    >
      <ArrowIcon direction={direction} />
    </button>
  )
}

function UseCaseCard({
  title,
  description,
  href,
  ctaLabel,
  imageSrc,
  imageAlt,
  imageClassName,
}: UseCaseCardData) {
  return (
    <article className="border-brand-dark-green/50 relative h-[317px] w-[345px] shrink-0 overflow-hidden rounded-xl border bg-brand-off-white">
      <h3 className="text-h4-sans absolute left-4 top-4 w-[249px] text-brand-dark-green">
        {title}
      </h3>

      <div className="absolute left-4 top-[83px]">
        <Button
          href={href}
          variant="link"
          className="cursor-pointer transition-opacity hover:opacity-70"
        >
          {ctaLabel}
        </Button>
      </div>

      <p className="text-mono-s absolute bottom-4 left-4 w-[186px] text-brand-dark-green">
        {description}
      </p>

      <div
        className={`absolute bottom-[11px] right-[10px] overflow-hidden ${imageClassName}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
    </article>
  )
}

type Props = {
  data: CardGridSection
}

export default function TechOverviewUseCases({ data }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef(0)
  const dragStartScrollLeftRef = useRef(0)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!scrollRef.current) return

    const initialOffset = window.innerWidth >= 768 ? 120 : 333
    scrollRef.current.scrollLeft = initialOffset
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const amount = direction === 'left' ? -357 : 357
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const baseCards: UseCaseCardData[] = data.cards.flatMap((card, index) =>
    card.image && card.cta
      ? [
          {
            title: card.title,
            description: card.description ?? '',
            href: card.cta.href,
            ctaLabel: card.cta.label,
            imageSrc: card.image.src,
            imageAlt: card.image.alt || card.title,
            imageClassName:
              CARD_IMAGE_CLASSNAMES[index] ?? CARD_IMAGE_CLASSNAMES[0],
          },
        ]
      : []
  )
  // Carousel duplicates cards for infinite-feel scrolling; matches existing
  // behaviour.
  const cards = [...baseCards, ...baseCards]

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return

    isDraggingRef.current = true
    setIsDragging(true)
    dragStartXRef.current = event.clientX
    dragStartScrollLeftRef.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current || !isDraggingRef.current) return

    const deltaX = event.clientX - dragStartXRef.current
    scrollRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX
  }

  const stopDragging = () => {
    isDraggingRef.current = false
    setIsDragging(false)
  }

  return (
    <section className="h-[820px] overflow-hidden bg-brand-off-white md:h-auto md:overflow-visible md:bg-transparent">
      <div className="h-[290px] overflow-hidden bg-brand-off-white px-3 pt-10 pb-0 md:h-auto md:overflow-visible md:pb-16">
        <div className="flex items-start justify-between gap-4 md:hidden">
          <div className="relative h-[81px] w-[107px] shrink-0 overflow-hidden">
            <Image
              src="/images/technology-stack/use-cases-top.jpg"
              alt=""
              fill
              sizes="107px"
              className="object-cover"
            />
          </div>

          <p className="text-mono-s w-[178px] text-brand-dark-green">
            {[data.subheading, data.subheadingExtra].filter(Boolean).join(' ')}
          </p>
        </div>

        <ContentWidth className="relative hidden md:block md:h-[309px]">
          <div className="absolute left-0 top-6 h-[81px] w-[107px] overflow-hidden">
            <Image
              src="/images/technology-stack/use-cases-top.jpg"
              alt=""
              fill
              sizes="107px"
              className="object-cover"
            />
          </div>

          {data.subheading ? (
            <p className="text-mono-s absolute top-6 left-[calc(50%+6px)] w-[calc(25%-18px)] min-w-[178px] max-w-[226px] text-brand-dark-green xl:left-[714px] xl:w-[226px] xl:max-w-none">
              {data.subheading}
            </p>
          ) : null}
          {data.subheadingExtra ? (
            <p className="text-mono-s absolute top-6 left-[calc(75%+3px)] w-[calc(25%-15px)] min-w-[178px] max-w-[226px] text-brand-dark-green xl:left-[1071px] xl:w-[226px] xl:max-w-none">
              {data.subheadingExtra}
            </p>
          ) : null}

          {data.heading ? (
            <h2 className="text-h2 absolute top-[140px] left-1/2 w-[464px] -translate-x-1/2 text-center text-brand-dark-green xl:left-[476px] xl:translate-x-0">
              {data.heading}
            </h2>
          ) : null}

          <div className="absolute left-0 top-[269px] flex gap-2.5">
            <ScrollControl direction="left" onClick={() => scroll('left')} />
            <ScrollControl direction="right" onClick={() => scroll('right')} />
          </div>

          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="link"
              className="absolute top-[272px] left-[calc(50%+6px)] cursor-pointer transition-opacity hover:opacity-70 xl:left-[714px]"
            >
              {data.cta.label}
            </Button>
          ) : null}
        </ContentWidth>

        {data.heading ? (
          <div className="relative left-1/2 mt-16 w-[464px] max-w-none -translate-x-1/2 md:hidden">
            <h2 className="text-h2 text-center text-brand-dark-green">
              {data.heading}
            </h2>
          </div>
        ) : null}

        {data.cta ? (
          <div className="mt-[52px] flex items-center justify-center md:hidden">
            <Button
              href={data.cta.href}
              variant="link"
              className="transition-opacity hover:opacity-70"
            >
              {data.cta.label}
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className={`mt-[76px] flex gap-3 overflow-x-auto px-3 pb-4 select-none md:mt-[94px] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {cards.map((card, index) => (
          <UseCaseCard key={`${card.title}-${index}`} {...card} />
        ))}
      </div>
    </section>
  )
}
