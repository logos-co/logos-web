'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

export interface AboutProblemCard {
  key: 'debt' | 'surveillance' | 'corruption' | 'stagnation'
  title: string
  body: string
  facts: string[]
  image: string
  tone: string
  textTone: string
  imageClassName?: string
}

interface AboutScrollStackProps {
  intro: string
  cards: AboutProblemCard[]
}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function DesktopProblemCard({ card }: { card: AboutProblemCard }) {
  return (
    <article
      className={`grid h-[434px] w-full grid-cols-2 gap-3 rounded-[18px] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${card.tone} ${card.textTone}`}
    >
      <div className="relative min-h-[422px] overflow-hidden rounded-xl">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="50vw"
          className={`object-cover ${card.imageClassName ?? ''}`}
        />
      </div>

      <div className="flex min-h-0 flex-col justify-between gap-8">
        <div className="grid gap-3 px-1.5 py-3 md:grid-cols-2">
          <h3 className="text-h3-serif">{card.title}</h3>
          <p className="font-sans text-[14px] leading-[1.2]">{card.body}</p>
        </div>

        <div className="flex flex-col gap-3 px-1.5 py-3">
          {card.facts.map((fact) => (
            <p
              key={fact}
              className="border-t border-current/50 pt-1.5 font-mono text-[10px] leading-[1.3]"
            >
              {fact}
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
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current
      if (!section) return
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches

      const progress = clamp(-section.getBoundingClientRect().top, 0, 4400)
      const startY = reducedMotion ? 140 : window.innerHeight + 64

      cardRefs.current.forEach((card, index) => {
        if (!card) return

        const targetY = 132 + index * 12
        const start = -360 + index * 760
        const end = start + 2200
        const amount = easeInOutCubic(
          reducedMotion ? 1 : clamp((progress - start) / (end - start), 0, 1)
        )
        const y = startY + (targetY - startY) * amount

        card.style.transform = `translate3d(0, ${y}px, 0)`
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div ref={sectionRef} className="hidden h-[4600px] md:block">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-h3-serif w-[940px] text-center">{intro}</p>
        </div>

        {cards.map((card, index) => (
          <div
            key={card.key}
            ref={(node) => {
              cardRefs.current[index] = node
            }}
            className="absolute inset-x-0 top-0 px-3 will-change-transform"
            style={{
              zIndex: index + 1,
              transform: 'translate3d(0, calc(100vh + 64px), 0)',
            }}
          >
            <DesktopProblemCard card={card} />
          </div>
        ))}
      </div>
    </div>
  )
}
