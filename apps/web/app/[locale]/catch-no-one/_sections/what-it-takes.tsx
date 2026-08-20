import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

import { WHAT_IT_TAKES } from '../_content'

import { Column, Panel, Prose, SectionHeading, Standfirst } from './atoms'

const CARD_HREFS = [ROUTES.buildTheParallel, ROUTES.movement] as const

export function WhatItTakes() {
  const cards = WHAT_IT_TAKES.cards.map((card, index) => ({
    ...card,
    href: CARD_HREFS[index]!,
  }))

  return (
    <Panel className="rounded-t-[30px] bg-accent-tan text-brand-dark-green">
      <Column>
        <SectionHeading eyebrow={WHAT_IT_TAKES.eyebrow}>
          {WHAT_IT_TAKES.heading}
        </SectionHeading>

        <Standfirst lines={WHAT_IT_TAKES.standfirstLines} />

        {WHAT_IT_TAKES.body.map((paragraph, index) => (
          <Prose key={`body-${index}`}>{paragraph}</Prose>
        ))}
      </Column>

      {/*
        Figma lays these out as two fixed 460px cards from the left gutter, so
        the row is 960px and overhangs the right one — not a stretched pair.
        The column chain stays on `min-[…]` throughout: named breakpoint
        variants are emitted after arbitrary ones here, so a `md:` rule would
        otherwise beat the 1440 one.
      */}
      <div className="grid w-full grid-cols-1 gap-6 min-[768px]:grid-cols-2 min-[768px]:gap-10 min-[1440px]:grid-cols-[460px_460px]">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex min-h-[280px] flex-col items-center justify-center gap-6 rounded-[12px] bg-[#2f2f2f] px-6 text-brand-off-white transition-opacity hover:opacity-90 md:min-h-[480px]"
          >
            <span className="text-h2 text-center min-[768px]:max-[1023px]:text-[40px]">
              {card.title}
            </span>
            <span className="font-mono-body rounded-[6px] bg-accent-light-blue p-1.5 text-[10px] leading-[1.3] text-brand-dark-green">
              {card.cta}
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  )
}
