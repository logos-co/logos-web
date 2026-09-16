'use client'

import Image from 'next/image'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { PrifiCopySection } from '@repo/content/schemas'

import CivilSocietyAccordion, {
  type AccordionClassNames,
} from '@/components/sections/home/civil-society-accordion'
import { DragScroll } from '@/components/ui'

import { TRIM } from './atoms'

type SupplyChainCopy = PrifiCopySection['supplyChain']
type ChainLink = SupplyChainCopy['links'][number]

/**
 * Below 1440px the link cards and the graph scroll sideways. The scrollbar is
 * hidden like the site's other card rows, so `DragScroll` lets mouse users
 * drag them.
 */
const SIDE_SCROLL =
  '-mx-3 cursor-pointer overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden desktop:mx-0 desktop:cursor-auto desktop:overflow-visible desktop:px-0'

const KEY_STEPS: Record<string, (index: number, linkCount: number) => number> =
  {
    ArrowRight: (index, linkCount) => (index + 1) % linkCount,
    ArrowLeft: (index, linkCount) => (index - 1 + linkCount) % linkCount,
    Home: () => 0,
    End: (_index, linkCount) => linkCount - 1,
  }

/** Figma sets the card copy on two lines; one line reads better in a row. */
const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ')

/**
 * The seven links of the supply chain, in two layouts. From 1024px up they
 * are Figma's card row, where hovering a card switches the one panel under
 * it. Below that the row scrolls sideways with the panel far beneath, which
 * is hard to follow on a phone, so the links become the homepage's dropdown
 * accordion instead: every link is listed, closed, and opens in place.
 */
export function ChainExplorer({ copy }: { copy: SupplyChainCopy }) {
  return (
    <>
      <ChainAccordion copy={copy} />
      <ChainTabs copy={copy} />
    </>
  )
}

/**
 * The homepage accordion, styled like the Rajasthan page's tracks on this
 * dark section: white hairlines, a serif title and the link's one-liner as
 * the subtitle once there is room for it.
 */
const ACCORDION_CLASS_NAMES: AccordionClassNames = {
  item: 'border-t border-white/20 last:border-b',
  row: 'flex w-full items-center justify-between gap-6 py-6 text-left',
  title: `font-display text-[30px] leading-none tracking-[-0.03em] text-white ${TRIM}`,
  aside: 'flex items-center gap-4',
  subtitle:
    'hidden text-right font-mono text-xs leading-[1.3] font-semibold uppercase text-white/60 sm:inline',
  panel: 'pb-10',
  body: 'flex flex-col gap-10 text-white',
}

function ChainAccordion({ copy }: { copy: SupplyChainCopy }) {
  return (
    <div data-chain-layout="accordion" className="mt-[120px] lg:hidden">
      <CivilSocietyAccordion
        items={copy.links.map((link) => ({
          key: link.label,
          title: link.label,
          subtitle: oneLine(link.body),
          eventName: `Supply chain - ${link.label}`,
          content: <LinkDetails copy={copy} link={link} />,
        }))}
        classNames={ACCORDION_CLASS_NAMES}
        initialOpenKey={null}
      />
    </div>
  )
}

/** One link's facts, costs and diagram, opened inside its accordion row. */
function LinkDetails({
  copy,
  link,
}: {
  copy: SupplyChainCopy
  link: ChainLink
}) {
  return (
    <>
      {/* Phones hide the row's subtitle, so it leads the panel instead. */}
      <p className="font-mono text-xs leading-[1.3] font-semibold uppercase sm:hidden">
        {oneLine(link.body)}
      </p>
      <Facts factLabels={copy.factLabels} link={link} />
      <Stats statLabels={copy.statLabels} link={link} fluid />
      <Graph link={link} />
    </>
  )
}

function ChainTabs({ copy }: { copy: SupplyChainCopy }) {
  const { links } = copy
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const link = links[active]!

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = KEY_STEPS[event.key]
    if (!step) return
    event.preventDefault()
    const next = step(index, links.length)
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div data-chain-layout="tabs" className="hidden lg:block">
      <DragScroll className={`relative mt-[176px] ${SIDE_SCROLL}`}>
        <div
          role="tablist"
          aria-label={copy.tabListLabel}
          className="flex w-max gap-3 desktop:w-full desktop:justify-between desktop:gap-0"
        >
          {links.map((item, index) => {
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
        className="relative mt-[89.4px] flex flex-col gap-10 desktop:h-[442px] desktop:flex-row desktop:items-start desktop:justify-between desktop:gap-0"
      >
        <div
          className={`flex flex-col gap-[54px] desktop:w-[599px] desktop:justify-between desktop:gap-0 desktop:pt-[18px] ${
            link.graph.tall ? 'desktop:h-[442px]' : 'desktop:h-[409px]'
          }`}
        >
          <Facts factLabels={copy.factLabels} link={link} />
          <Stats statLabels={copy.statLabels} link={link} />
        </div>
        <Graph link={link} />
      </div>
    </div>
  )
}

function Facts({
  factLabels,
  link,
}: {
  factLabels: SupplyChainCopy['factLabels']
  link: ChainLink
}) {
  const rows = [
    [factLabels.exposes, link.exposes],
    [factLabels.tools, link.tools],
    [factLabels.threat, link.threat],
  ] as const

  return (
    <div className="flex flex-col gap-[22px] font-mono text-xs leading-[1.3] uppercase">
      {rows.map(([label, body]) => (
        <div key={label} className="flex flex-col items-start gap-2">
          <p className={`border-b border-white pb-[3.5px] font-bold ${TRIM}`}>
            {label}
          </p>
          <p className={`lg:whitespace-pre-line ${TRIM}`}>{body}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Most links show one figure per card. Diligence and Contracting stack two
 * smaller figures in the first card, which makes both cards 164px tall.
 */
function Stats({
  link,
  statLabels,
  fluid = false,
}: {
  link: ChainLink
  statLabels: SupplyChainCopy['statLabels']
  /** Share the row's width instead of Figma's fixed 291px cards. */
  fluid?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-[17px]">
      {link.stats.map((entries, index) => (
        <div
          key={statLabels[index]}
          className={`flex min-h-[131px] w-full flex-col rounded-[5px] bg-[#404040] px-5 py-2.5 leading-[1.35] uppercase ${
            fluid ? 'sm:w-auto sm:flex-1' : 'sm:w-[291px]'
          } ${entries.length > 1 ? 'gap-2.5' : 'justify-between'} ${
            link.graph.tall ? 'desktop:min-h-[164px]' : ''
          }`}
        >
          <p className="font-mono text-xs leading-[1.35] font-semibold">
            {statLabels[index]}
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
 * Only the active diagram is mounted so the page does not download all seven
 * full-width images up front. On phones the diagram keeps a legible size and
 * scrolls sideways instead.
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
        <Image
          key={link.graph.src}
          src={link.graph.src}
          alt={link.graph.alt}
          fill
          loading="lazy"
          sizes="(min-width: 1440px) 803px, 100vw"
          className="object-cover object-top"
        />
      </div>
    </DragScroll>
  )
}
