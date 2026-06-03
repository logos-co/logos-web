'use client'

import { CircleArrowIcon } from '@acid-info/logos-ui'
import Image from 'next/image'
import { type PointerEvent, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui'
import {
  ABOUT_CAROUSEL_CARD_GAP,
  ABOUT_CAROUSEL_CARD_WIDTH,
  ABOUT_CAROUSEL_TOTAL_SCROLL_DISTANCE,
  ABOUT_CAROUSEL_VISUAL_TRANSITION_MS,
  getAboutCarouselState,
} from './about-carousel-motion'

export interface AboutProblemFactLink {
  label: string
  href: string
}

export interface AboutProblemCard {
  key: 'debt' | 'surveillance' | 'corruption' | 'stagnation'
  title: string
  body: string
  facts: string[]
  factLinks: Partial<Record<number, AboutProblemFactLink>>
  image: string
  tone: string
  textTone: string
  imageClassName?: string
}

interface AboutScrollStackProps {
  intro: string
  cards: AboutProblemCard[]
  closingParagraphs: string[]
  cta?: {
    href: string
    label: string
  }
}

function FactText({
  fact,
  link,
}: {
  fact: string
  link?: AboutProblemFactLink
}) {
  if (!link || !fact.includes(link.label)) {
    return <>{fact}</>
  }

  const [before, after] = fact.split(link.label)

  return (
    <>
      {before}
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer underline decoration-current underline-offset-2"
      >
        {link.label}
      </a>
      {after}
    </>
  )
}

function ProblemCard({ card }: { card: AboutProblemCard }) {
  return (
    <article
      className={`flex h-[min(540px,calc(100svh-176px))] w-[calc(100vw-48px)] max-w-[345px] shrink-0 flex-col gap-[6px] rounded-[18px] p-[6px] lg:h-[434px] lg:w-[932px] lg:max-w-none lg:flex-row [@media(max-height:760px)]:lg:h-[390px] ${card.tone} ${card.textTone}`}
    >
      <div className="relative h-[42%] min-h-[170px] shrink-0 overflow-hidden rounded-xl lg:h-[422px] lg:w-[454px] [@media(max-height:760px)]:lg:h-[378px]">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(max-width: 1023px) calc(100vw - 48px), 454px"
          className={`object-cover ${card.imageClassName ?? ''}`}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-3 px-1.5 py-2 lg:gap-10 lg:py-3 [@media(max-height:760px)]:lg:gap-6">
          <h3 className="text-h3-serif text-[38px] lg:text-[48px] [@media(max-height:760px)]:lg:text-[30px]">
            {card.title}
          </h3>
          <p className="font-sans text-[12px] leading-[1.2] lg:text-[14px] [@media(max-height:760px)]:lg:text-[12px]">
            {card.body}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-1.5 py-2 lg:gap-3 lg:py-3 [@media(max-height:760px)]:gap-2">
          {card.facts.map((fact, index) => (
            <p
              key={fact}
              className="border-t border-current/50 pt-1.5 font-mono text-[8px] leading-[1.25] lg:text-[10px] lg:leading-[1.3] [@media(max-height:760px)]:text-[9px]"
            >
              <FactText fact={fact} link={card.factLinks[index]} />
            </p>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function AboutScrollStack({
  intro,
  cards,
  closingParagraphs,
  cta,
}: AboutScrollStackProps) {
  const dragRef = useRef({
    active: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
  })
  const sectionRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let frame = 0
    const visualTransition = `opacity ${ABOUT_CAROUSEL_VISUAL_TRANSITION_MS}ms ease-out, filter ${ABOUT_CAROUSEL_VISUAL_TRANSITION_MS}ms ease-out, transform ${ABOUT_CAROUSEL_VISUAL_TRANSITION_MS}ms ease-out`

    const update = () => {
      frame = 0

      const section = sectionRef.current
      const intro = introRef.current
      const carousel = carouselRef.current
      const closing = closingRef.current
      const track = trackRef.current
      if (!section || !intro || !carousel || !closing || !track) return

      const {
        activeIndex: nextIndex,
        carouselBlur,
        carouselOpacity,
        carouselTranslateY,
        closingOpacity,
        closingTranslateY,
        introBlur,
        introOpacity,
        introTranslateY,
        offset,
      } = getAboutCarouselState({
        activeIndex,
        sectionTop: section.getBoundingClientRect().top,
        cardCount: cards.length,
      })
      const firstCard = track.querySelector('article')
      const measuredStep = firstCard
        ? firstCard.getBoundingClientRect().width + ABOUT_CAROUSEL_CARD_GAP
        : null
      const trackOffset = measuredStep ? activeIndex * measuredStep : offset

      intro.style.transition = visualTransition
      intro.style.opacity = String(introOpacity)
      intro.style.filter = `blur(${introBlur}px)`
      intro.style.transform = `translate3d(-50%, calc(-50% + ${introTranslateY}px), 0)`
      carousel.style.transition = visualTransition
      carousel.style.opacity = String(carouselOpacity)
      carousel.style.filter = `blur(${carouselBlur}px)`
      carousel.style.pointerEvents = carouselOpacity > 0.5 ? 'auto' : 'none'
      carousel.style.transform = `translate3d(0, ${carouselTranslateY}px, 0)`
      closing.style.transition = visualTransition
      closing.style.opacity = String(closingOpacity)
      closing.style.pointerEvents = closingOpacity > 0.75 ? 'auto' : 'none'
      closing.style.transform = `translate3d(-50%, calc(-50% + ${closingTranslateY}px), 0)`
      track.style.transform = `translate3d(${-trackOffset}px, 0, 0)`
      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex)
      }
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [activeIndex, cards.length])

  const getSectionPageTop = () => {
    const section = sectionRef.current
    if (!section) return null

    return window.scrollY + section.getBoundingClientRect().top
  }

  const scrollToCard = (index: number) => {
    setActiveIndex(Math.min(Math.max(index, 0), cards.length - 1))
  }

  const handleCarouselPointerDown = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === 'mouse') return

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  const handleCarouselPointerUp = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    dragRef.current.active = false

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    const isHorizontalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4
    if (!isHorizontalSwipe) return

    if (deltaX < 0) {
      scrollToCard(activeIndex + 1)
      return
    }

    scrollToCard(activeIndex - 1)
  }

  const handleCarouselPointerCancel = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current.active = false
    }
  }

  const scrollPastCarousel = () => {
    const top = getSectionPageTop()
    if (top === null) return

    window.scrollTo({
      top: top + ABOUT_CAROUSEL_TOTAL_SCROLL_DISTANCE,
      behavior: 'smooth',
    })
  }

  return (
    <div
      ref={sectionRef}
      className="block"
      style={{ height: `calc(100vh + ${ABOUT_CAROUSEL_TOTAL_SCROLL_DISTANCE}px)` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-brand-dark-green">
        <p
          ref={introRef}
          className="text-h3-serif absolute top-1/2 left-1/2 w-[calc(100%-24px)] max-w-[369px] text-center will-change-[filter,opacity,transform] lg:w-[940px] lg:max-w-none [@media(max-height:760px)]:lg:w-[820px] [@media(max-height:760px)]:lg:text-[30px]"
        >
          {intro}
        </p>

        <div
          ref={carouselRef}
          className="absolute inset-0 opacity-0 will-change-[filter,opacity,transform]"
        >
          <div
            className="absolute top-[calc(50%-332px)] left-1/2 flex h-[30px] -translate-x-1/2 items-center justify-center gap-10 lg:top-[calc(50%-279px)] [@media(max-height:760px)]:lg:top-[calc(50%-257px)]"
            aria-label="Problem card controls"
          >
            <button
              type="button"
              aria-label="Previous problem"
              className="cursor-pointer text-brand-off-white transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={activeIndex === 0}
              onClick={() => scrollToCard(activeIndex - 1)}
            >
              <CircleArrowIcon size={30} />
            </button>
            <button
              type="button"
              aria-label={
                activeIndex === cards.length - 1
                  ? 'Continue to next section'
                  : 'Next problem'
              }
              className="cursor-pointer text-brand-off-white transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
              onClick={() => {
                if (activeIndex === cards.length - 1) {
                  scrollPastCarousel()
                  return
                }

                scrollToCard(activeIndex + 1)
              }}
            >
              <CircleArrowIcon size={30} direction="right" />
            </button>
          </div>

          <div
            className="absolute top-1/2 left-1/2 w-screen -translate-x-1/2 -translate-y-1/2 touch-pan-y overflow-hidden"
            onPointerCancel={handleCarouselPointerCancel}
            onPointerDown={handleCarouselPointerDown}
            onPointerUp={handleCarouselPointerUp}
          >
            <div
              ref={trackRef}
              className="flex gap-3 transition-transform duration-500 ease-out will-change-transform"
              style={{
                paddingLeft: `max(24px, calc((100vw - ${ABOUT_CAROUSEL_CARD_WIDTH}px) / 2))`,
                paddingRight: `max(24px, calc((100vw - ${ABOUT_CAROUSEL_CARD_WIDTH}px) / 2))`,
              }}
            >
              {cards.map((card) => (
                <ProblemCard key={card.key} card={card} />
              ))}
            </div>
          </div>
        </div>

        <div
          ref={closingRef}
          className="absolute top-1/2 left-1/2 flex w-full max-w-[369px] flex-col items-center gap-15 px-6 text-center opacity-0 will-change-[opacity,transform] lg:max-w-[860px]"
        >
          <div className="text-h3-serif flex flex-col gap-[1em]">
            {closingParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {cta ? (
            <Button
              href={cta.href}
              className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-80"
            >
              {cta.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
