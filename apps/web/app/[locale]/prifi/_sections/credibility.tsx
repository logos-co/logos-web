import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { CREDIBILITY, TRANSPARENCY } from '../_content'
import { TRIM } from './atoms'

/**
 * Figma splits this into two frames — the heading row (226px) and the cards
 * (470px) — but the cards are the two answers to the heading, so they share
 * one section and sit under its h2.
 */
export function Credibility() {
  return (
    <section className="bg-gray-01 pt-16 pb-16 text-brand-dark-green lg:pt-[120px] lg:pb-[120px]">
      <ContentWidth>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className={`text-h3-serif lg:w-[43.64%] ${TRIM}`}>
            {TRANSPARENCY.heading}
          </h2>
          <div className="flex flex-col gap-6 lg:w-[50.42%]">
            <div className="h-px bg-brand-dark-green/10" />
            <p className="text-mono-s text-black">{TRANSPARENCY.body}</p>
            <div className="h-px bg-brand-dark-green/10" />
          </div>
        </div>
        {/* Figma's 30px under the heading row plus the cards' 12px top padding,
          less the 5.2px the 12px note adds (10px in the file), so the cards
          keep Figma's position. */}
        <div className="mt-11 flex flex-col gap-3 lg:mt-[36.8px] lg:flex-row">
          {CREDIBILITY.map((card) => (
            <CredibilityCard key={card.title} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

/**
 * The two card photos are already blurred in Figma; the crops here are the
 * part of each fill the card shows.
 */
function CredibilityCard({ card }: { card: (typeof CREDIBILITY)[number] }) {
  return (
    <article className="relative flex min-h-[338px] flex-1 flex-col items-center justify-center gap-[34px] overflow-hidden rounded-[20px] py-12 text-center text-white lg:h-[338px] lg:py-0">
      <Image
        src={card.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      <h3 className="text-h3-sans relative">{card.title}</h3>
      {/* Figma sets these lines at 0.7 line height with a blank line between
          them. A 1.2 line height with a 3.6px gap puts the baselines in the
          same place, and the negative margins give back the taller line boxes,
          so the copy can still wrap under a larger text size. */}
      <div className="relative px-3 text-base leading-[1.2] tracking-[-0.02em] lg:text-[18px] xl:-my-[4.5px]">
        {/* Figma counts this line's trailing space when centring it. */}
        <p>
          {card.body[0]}
          {'\u00a0'}
        </p>
        <p className="mt-[1.2em] xl:mt-[3.6px]">{card.body[1]}</p>
      </div>
      {/* Figma strokes these rules at 0.2px, which reads as a faint hairline
          rather than a solid white line. */}
      {/* The 12px note (10px in the file) makes this group 4.2px taller;
          giving that back keeps the centred content on Figma's lines. */}
      <div className="relative flex w-full flex-col gap-3 xl:-mb-[4.2px]">
        <div className="h-px bg-white/25" />
        <p className="text-eyebrow px-3">{card.note}</p>
        <div className="h-px bg-white/25" />
      </div>
    </article>
  )
}
