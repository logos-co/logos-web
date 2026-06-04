'use client'

import { CircleArrowIcon } from '@acid-info/logos-ui'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import Image from 'next/image'
import { useRef } from 'react'

import { Button } from '@/components/ui'
import { EASE } from '@/lib/motion'

const CARD_GAP = 12

/** Slow fade + gentle settle. Elements end at their natural layout position. */
const slowReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.4, ease: EASE.out } },
}

/** Stagger container for the closing block — reveals children one after another. */
const slowStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.25, delayChildren: 0.1 } },
}

const VIEWPORT_ONCE = { once: true, amount: 0.35 } as const

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

interface AboutCarouselProps {
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
      className={`flex h-[540px] w-[calc(100vw-48px)] max-w-[345px] shrink-0 snap-center flex-col gap-[6px] rounded-[18px] p-[6px] lg:h-[434px] lg:w-[932px] lg:max-w-none lg:flex-row ${card.tone} ${card.textTone}`}
    >
      <div className="relative h-[42%] min-h-[170px] shrink-0 overflow-hidden rounded-xl lg:h-[422px] lg:w-[454px]">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(max-width: 1023px) calc(100vw - 48px), 454px"
          className={`object-cover ${card.imageClassName ?? ''}`}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-3 px-1.5 py-2 lg:gap-10 lg:py-3">
          <h3 className="text-h3-serif text-[38px] lg:text-[48px]">
            {card.title}
          </h3>
          <p className="font-sans text-[12px] leading-[1.2] lg:text-[14px]">
            {card.body}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-1.5 py-2 lg:gap-3 lg:py-3">
          {card.facts.map((fact, index) => (
            <p
              key={fact}
              className="border-t border-current/50 pt-1.5 font-mono text-[8px] leading-[1.25] lg:text-[10px] lg:leading-[1.3]"
            >
              <FactText fact={fact} link={card.factLinks[index]} />
            </p>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function AboutCarousel({
  intro,
  cards,
  closingParagraphs,
  cta,
}: AboutCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    const track = trackRef.current
    if (!track) return

    const slides = Array.from(track.querySelectorAll('article'))
    if (slides.length === 0) return

    const step = slides[0].getBoundingClientRect().width + CARD_GAP
    const current = Math.round(track.scrollLeft / step)
    // Clamp the target index so the arrows can't scroll past the first or
    // last card into the empty background.
    const next = Math.min(
      Math.max(current + (direction === 'left' ? -1 : 1), 0),
      slides.length - 1
    )

    // Center the target card within the track (horizontal only). The browser
    // clamps at the edges, so the end cards rest flush instead of overscrolling.
    const trackRect = track.getBoundingClientRect()
    const slideRect = slides[next].getBoundingClientRect()
    const delta =
      slideRect.left -
      trackRect.left -
      (track.clientWidth - slideRect.width) / 2
    track.scrollTo({ left: track.scrollLeft + delta, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col items-center gap-[200px] py-[200px]">
      <motion.p
        variants={slowReveal}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="text-h3-serif w-full max-w-[369px] px-6 text-center [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] lg:max-w-[880px] lg:px-0"
      >
        {intro}
      </motion.p>

      <motion.div
        variants={slowReveal}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="flex w-full flex-col items-center gap-6"
      >
        <div
          className="flex items-center justify-center gap-10"
          aria-label="Problem card controls"
        >
          <button
            type="button"
            aria-label="Previous problem"
            className="cursor-pointer text-brand-off-white transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-off-white"
            onClick={() => scroll('left')}
          >
            <CircleArrowIcon size={30} />
          </button>
          <button
            type="button"
            aria-label="Next problem"
            className="cursor-pointer text-brand-off-white transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-off-white"
            onClick={() => scroll('right')}
          >
            <CircleArrowIcon size={30} direction="right" />
          </button>
        </div>

        <div
          ref={trackRef}
          className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingLeft: 'max(24px, calc((100vw - 932px) / 2))',
            paddingRight: 'max(24px, calc((100vw - 932px) / 2))',
          }}
        >
          {cards.map((card) => (
            <ProblemCard key={card.key} card={card} />
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={slowStagger}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="flex w-full max-w-[369px] flex-col items-center gap-15 px-6 text-center lg:max-w-[940px] lg:px-0"
      >
        <motion.div
          variants={slowReveal}
          className="text-h3-serif flex flex-col gap-[1em]"
        >
          {closingParagraphs.map((paragraph) => (
            <p key={paragraph} className="whitespace-normal lg:whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </motion.div>

        {cta ? (
          <motion.div variants={slowReveal}>
            <Button
              href={cta.href}
              className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-opacity hover:opacity-80"
            >
              {cta.label}
            </Button>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  )
}
