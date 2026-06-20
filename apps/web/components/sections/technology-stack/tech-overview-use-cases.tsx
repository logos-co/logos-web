'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import type { CardGridSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Button, useDragScroll } from '@/components/ui'
import {
  getTechOverviewUseCasesInitialScrollLeft,
  getTechOverviewUseCaseCards,
  isTechOverviewUseCasesScrollable,
  type TechOverviewUseCaseCard,
} from '@/lib/technology-stack-use-cases'
import { cn } from '@/lib/cn'

const DOC_LINK_CLASSNAME =
  'transition-opacity hover:opacity-70 [&>span>span]:border-b-0 [&>span>span]:underline [&>span>span]:decoration-brand-dark-green/50 [&>span>span]:underline-offset-[2px]'

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
}: TechOverviewUseCaseCard) {
  return (
    <a
      href={href}
      className="border-brand-dark-green/50 relative block h-[317px] w-[345px] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-90"
    >
      <h3 className="text-h4-sans absolute left-4 top-4 w-[249px] text-brand-dark-green">
        {title}
      </h3>

      <div className="absolute left-4 top-[83px]">
        <span className="font-mono text-[13px] leading-[1.1] font-bold tracking-normal uppercase underline decoration-brand-dark-green/50 underline-offset-[4px]">
          {ctaLabel}
        </span>
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
    </a>
  )
}

type Props = {
  data: CardGridSection
}

export default function TechOverviewUseCases({ data }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragHandlers = useDragScroll()
  const [canScroll, setCanScroll] = useState(true)

  const updateCanScroll = useCallback(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return false

    const nextCanScroll = isTechOverviewUseCasesScrollable({
      scrollWidth: scrollElement.scrollWidth,
      clientWidth: scrollElement.clientWidth,
    })

    setCanScroll(nextCanScroll)
    if (!nextCanScroll) scrollElement.scrollLeft = 0

    return nextCanScroll
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    if (updateCanScroll()) {
      scrollElement.scrollLeft = getTechOverviewUseCasesInitialScrollLeft()
    }

    const resizeObserver = new ResizeObserver(updateCanScroll)
    resizeObserver.observe(scrollElement)
    window.addEventListener('resize', updateCanScroll)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateCanScroll)
    }
  }, [updateCanScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const amount = direction === 'left' ? -357 : 357
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const cards = getTechOverviewUseCaseCards(data.cards)

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

          {canScroll ? (
            <div className="absolute left-0 top-[269px] flex gap-2.5">
              <ScrollControl direction="left" onClick={() => scroll('left')} />
              <ScrollControl direction="right" onClick={() => scroll('right')} />
            </div>
          ) : null}

          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="link"
              className={`absolute top-[272px] left-[calc(50%+6px)] cursor-pointer xl:left-[714px] ${DOC_LINK_CLASSNAME}`}
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
          <div className="mt-13 flex items-center justify-center md:hidden">
            <Button
              href={data.cta.href}
              variant="link"
              className={DOC_LINK_CLASSNAME}
            >
              {data.cta.label}
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'mt-19 flex cursor-pointer gap-3 overflow-x-auto px-3 pb-4 select-none md:mt-12.5',
          canScroll ? 'justify-start' : 'justify-center'
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        {...dragHandlers}
      >
        {cards.map((card, index) => (
          <UseCaseCard key={`${card.title}-${index}`} {...card} />
        ))}
      </div>
    </section>
  )
}
