'use client'

import Image from 'next/image'
import { useId, useRef, useState, type KeyboardEvent } from 'react'

import { DragScroll } from '@/components/ui'

import { SUPPLY_CHAIN } from '../_content'
import { TRIM } from './atoms'

type ChainLink = (typeof SUPPLY_CHAIN.links)[number]

const LINKS = SUPPLY_CHAIN.links

/**
 * Below 1440px the link cards and the graph scroll sideways. The scrollbar is
 * hidden like the site's other card rows, so `DragScroll` lets mouse users
 * drag them.
 */
const SIDE_SCROLL =
  '-mx-3 cursor-pointer overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden desktop:mx-0 desktop:cursor-auto desktop:overflow-visible desktop:px-0'

/** Each distinct diagram once, so every one is loaded before it is shown. */
const GRAPHS = [
  ...new Map(LINKS.map((link) => [link.graph.src, link.graph])).values(),
]

const KEY_STEPS: Record<string, (index: number) => number> = {
  ArrowRight: (index) => (index + 1) % LINKS.length,
  ArrowLeft: (index) => (index - 1 + LINKS.length) % LINKS.length,
  Home: () => 0,
  End: () => LINKS.length - 1,
}

/**
 * The seven link cards and the panel under them. Figma draws one frame per
 * link (850:2325 to 851:3190) with that card filled white; hovering, focusing
 * or tapping a card switches the panel to that frame's facts, costs and
 * diagram.
 */
export function ChainExplorer() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const link = LINKS[active]!

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = KEY_STEPS[event.key]
    if (!step) return
    event.preventDefault()
    const next = step(index)
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <>
      <DragScroll
        className={`relative mt-[120px] lg:mt-[176px] ${SIDE_SCROLL}`}
      >
        <div
          role="tablist"
          aria-label="The links of the transaction supply chain"
          className="flex w-max gap-3 desktop:w-full desktop:justify-between desktop:gap-0"
        >
          {LINKS.map((item, index) => {
            const isActive = index === active
            return (
              <button
                key={item.label}
                ref={(node) => {
                  tabs.current[index] = node
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={isActive}
                aria-controls={`${id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`flex w-[191px] shrink-0 cursor-pointer flex-col gap-3.5 rounded-[5px] border border-white p-2.5 pt-[11px] text-left font-mono text-xs leading-[1.35] font-semibold uppercase transition-colors duration-150 ${
                  isActive ? 'bg-white text-black' : 'text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className="whitespace-pre-line">{item.body}</span>
              </button>
            )
          })}
        </div>
      </DragScroll>

      {/* Figma's 96px, less the 6.6px the 12px link copy adds to the cards
          (10px in the file), so this block keeps Figma's position. Desktop
          reserves the tallest variant (442px) so hovering never moves the
          sections below. */}
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
        className="relative mt-24 flex flex-col gap-10 lg:mt-[89.4px] desktop:h-[442px] desktop:flex-row desktop:items-start desktop:justify-between desktop:gap-0"
      >
        <div
          className={`flex flex-col gap-[54px] desktop:w-[599px] desktop:justify-between desktop:gap-0 desktop:pt-[18px] ${
            link.graph.tall ? 'desktop:h-[442px]' : 'desktop:h-[409px]'
          }`}
        >
          <Facts link={link} />
          <Stats link={link} />
        </div>
        <Graph link={link} />
      </div>
    </>
  )
}

function Facts({ link }: { link: ChainLink }) {
  const { factLabels } = SUPPLY_CHAIN
  const rows = [
    [factLabels.exposes, link.exposes],
    [factLabels.tools, link.tools],
    [factLabels.threat, link.threat],
  ] as const

  return (
    <div className="flex flex-col gap-[22px] font-mono text-xs leading-[1.3] uppercase">
      <p className={`font-medium ${TRIM}`}>{SUPPLY_CHAIN.intro}</p>
      {rows.map(([label, body]) => (
        <div key={label} className="flex flex-col items-start gap-2">
          <p className={`border-b border-white pb-[3.5px] font-bold ${TRIM}`}>
            {label}
          </p>
          <p className={`lg:whitespace-pre-line ${TRIM}`}>{body}</p>
        </div>
      ))}
      <p className={`font-bold lg:whitespace-pre-line ${TRIM}`}>{link.outro}</p>
    </div>
  )
}

/**
 * Most links show one figure per card. Diligence and Contracting stack two
 * smaller figures in the first card, which makes both cards 164px tall.
 */
function Stats({ link }: { link: ChainLink }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-[17px]">
      {link.stats.map((entries, index) => (
        <div
          key={SUPPLY_CHAIN.statLabels[index]}
          className={`flex min-h-[131px] w-full flex-col rounded-[5px] bg-[#404040] px-5 py-2.5 leading-[1.35] uppercase sm:w-[291px] ${
            entries.length > 1 ? 'gap-2.5' : 'justify-between'
          } ${link.graph.tall ? 'desktop:min-h-[164px]' : ''}`}
        >
          <p className="font-mono text-xs leading-[1.35] font-semibold">
            {SUPPLY_CHAIN.statLabels[index]}
          </p>
          {entries.length > 1 ? (
            entries.map((entry) => (
              <div key={entry.value}>
                <p className="font-display text-[31.88px] font-semibold">
                  {entry.value}
                </p>
                <p className="font-mono text-[8.77px] font-semibold">
                  {entry.note}
                </p>
              </div>
            ))
          ) : (
            <>
              <p className="font-display text-[50px] font-semibold">
                {entries[0]!.value}
              </p>
              <p className="font-mono text-[9px] sm:whitespace-pre-line">
                {entries[0]!.note}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Every diagram stays mounted and only the active one is shown, so hovering
 * across the cards swaps them without waiting for a download. On phones the
 * diagram keeps a legible size and scrolls sideways instead.
 */
function Graph({ link }: { link: ChainLink }) {
  return (
    <DragScroll className={SIDE_SCROLL}>
      <div
        className={`relative w-full min-w-[640px] overflow-hidden rounded-[5px] bg-[#0b0d0f] desktop:w-[803px] ${
          link.graph.tall
            ? 'aspect-[803/442] desktop:aspect-auto desktop:h-[442px]'
            : 'aspect-[803/409] desktop:aspect-auto desktop:h-[409px]'
        }`}
      >
        {GRAPHS.map((graph) => {
          const isShown = graph.src === link.graph.src
          return (
            <Image
              key={graph.src}
              src={graph.src}
              alt={isShown ? link.graph.alt : ''}
              aria-hidden={!isShown}
              fill
              sizes="(min-width: 1440px) 803px, 100vw"
              className={`object-cover object-top ${isShown ? 'opacity-100' : 'opacity-0'}`}
            />
          )
        })}
      </div>
    </DragScroll>
  )
}
