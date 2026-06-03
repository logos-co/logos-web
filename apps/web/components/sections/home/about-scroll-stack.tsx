'use client'

import { CircleArrowIcon } from '@acid-info/logos-ui'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import {
  ABOUT_CAROUSEL_CARD_WIDTH,
  ABOUT_CAROUSEL_SCROLL_DISTANCE,
  getAboutCarouselProgressForIndex,
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

function DesktopProblemCard({ card }: { card: AboutProblemCard }) {
  return (
    <article
      className={`flex h-[434px] w-[932px] shrink-0 gap-[6px] rounded-[18px] p-[6px] [@media(max-height:760px)]:h-[390px] ${card.tone} ${card.textTone}`}
    >
      <div className="relative h-[422px] w-[454px] shrink-0 overflow-hidden rounded-xl [@media(max-height:760px)]:h-[378px]">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="454px"
          className={`object-cover ${card.imageClassName ?? ''}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-10 px-1.5 py-3 [@media(max-height:760px)]:gap-6">
          <h3 className="text-h3-serif [@media(max-height:760px)]:text-[30px]">
            {card.title}
          </h3>
          <p className="font-sans text-[14px] leading-[1.2] [@media(max-height:760px)]:text-[12px]">
            {card.body}
          </p>
        </div>

        <div className="flex flex-col gap-3 px-1.5 py-3 [@media(max-height:760px)]:gap-2">
          {card.facts.map((fact, index) => (
            <p
              key={fact}
              className="border-t border-current/50 pt-1.5 font-mono text-[10px] leading-[1.3] [@media(max-height:760px)]:text-[9px]"
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
}: AboutScrollStackProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0

      const section = sectionRef.current
      const intro = introRef.current
      const carousel = carouselRef.current
      const track = trackRef.current
      if (!section || !intro || !carousel || !track) return

      const {
        activeIndex: nextIndex,
        carouselOpacity,
        introOpacity,
        offset,
      } = getAboutCarouselState({
        sectionTop: section.getBoundingClientRect().top,
        cardCount: cards.length,
      })

      intro.style.opacity = String(introOpacity)
      intro.style.transform = `translate3d(0, ${-24 * (1 - introOpacity)}px, 0)`
      carousel.style.opacity = String(carouselOpacity)
      carousel.style.pointerEvents = carouselOpacity > 0.5 ? 'auto' : 'none'
      track.style.transform = `translate3d(${-offset}px, 0, 0)`
      setActiveIndex(nextIndex)
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
  }, [cards.length])

  const getSectionPageTop = () => {
    const section = sectionRef.current
    if (!section) return null

    return window.scrollY + section.getBoundingClientRect().top
  }

  const scrollToCard = (index: number) => {
    const top = getSectionPageTop()
    if (top === null) return

    const progress = getAboutCarouselProgressForIndex({
      cardCount: cards.length,
      index,
    })

    window.scrollTo({
      top: top + progress * ABOUT_CAROUSEL_SCROLL_DISTANCE,
      behavior: 'smooth',
    })
  }

  const scrollPastCarousel = () => {
    const top = getSectionPageTop()
    if (top === null) return

    window.scrollTo({
      top: top + ABOUT_CAROUSEL_SCROLL_DISTANCE + window.innerHeight,
      behavior: 'smooth',
    })
  }

  return (
    <div
      ref={sectionRef}
      className="hidden h-[calc(100vh+2400px)] lg:block"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-brand-dark-green">
        <p
          ref={introRef}
          className="text-h3-serif absolute top-1/2 left-1/2 w-[940px] -translate-x-1/2 -translate-y-1/2 text-center will-change-[opacity,transform] [@media(max-height:760px)]:w-[820px] [@media(max-height:760px)]:text-[30px]"
        >
          {intro}
        </p>

        <div
          ref={carouselRef}
          className="absolute inset-0 opacity-0 will-change-opacity"
        >
          <div
            className="absolute top-[calc(50%-279px)] left-1/2 flex h-[30px] -translate-x-1/2 items-center justify-center gap-10 [@media(max-height:760px)]:top-[calc(50%-257px)]"
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
            className="absolute top-1/2 left-1/2 w-screen -translate-x-1/2 -translate-y-1/2 overflow-hidden"
          >
            <div
              ref={trackRef}
              className="flex gap-3 will-change-transform"
              style={{
                paddingLeft: `calc((100vw - ${ABOUT_CAROUSEL_CARD_WIDTH}px) / 2)`,
                paddingRight: `calc((100vw - ${ABOUT_CAROUSEL_CARD_WIDTH}px) / 2)`,
              }}
            >
              {cards.map((card) => (
                <DesktopProblemCard key={card.key} card={card} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
