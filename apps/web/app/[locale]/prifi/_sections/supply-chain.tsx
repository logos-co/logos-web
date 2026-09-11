import Image from 'next/image'

import { SUPPLY_CHAIN, SUPPLY_CHAIN_ID } from '../_content'
import { TRIM } from './atoms'

/** Figma's section height, which the baked glow image is cut to. */
const GLOW_HEIGHT = 'h-[1406px]'

export function SupplyChain() {
  return (
    <section
      id={SUPPLY_CHAIN_ID}
      className="relative overflow-hidden bg-black px-3 pt-[88px] pb-[87px] text-white lg:pt-[142px]"
    >
      {/* The forest photo blurred by 280px at 50% over black, baked into a
          small image instead of a live filter. */}
      <div aria-hidden className={`absolute inset-x-0 top-0 ${GLOW_HEIGHT}`}>
        <Image
          src="/images/prifi/supply-chain-glow.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
        />
      </div>

      <Intro />
      <ChainLinks />

      {/* Figma's 96px, less the 6.6px the 12px link copy adds to the cards
          (10px in the file), so this block keeps Figma's position. */}
      <div className="relative mt-24 flex flex-col gap-10 lg:mt-[89.4px] desktop:flex-row desktop:items-end desktop:justify-between desktop:gap-0">
        <div className="flex flex-col gap-[54px] desktop:w-[599px]">
          <Facts />
          <Stats />
        </div>
        <IdentityGraph />
      </div>
    </section>
  )
}

function Intro() {
  return (
    <div className="relative mx-auto flex max-w-[1140px] flex-col items-center gap-12 lg:flex-row lg:justify-between lg:gap-10">
      <div className="relative h-[278px] w-[193px] shrink-0 overflow-hidden rounded-full md:h-[417px] md:w-[289px]">
        <Image
          src="/images/prifi/pill.webp"
          alt=""
          fill
          sizes="289px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-[51px] lg:w-[631px]">
        <h2 className="font-display text-[40px] leading-none tracking-[-0.02em] lg:text-[60px] lg:whitespace-pre-line">
          {SUPPLY_CHAIN.heading}
        </h2>
        <div className="flex flex-col gap-10 font-sans font-medium leading-[1.4]">
          <p className="text-[18px] lg:w-[602px] lg:text-[22px]">
            {SUPPLY_CHAIN.lead}
          </p>
          <p className="text-xs lg:w-[476px]">{SUPPLY_CHAIN.note}</p>
        </div>
      </div>
    </div>
  )
}

function ChainLinks() {
  return (
    <ol className="relative -mx-3 mt-[120px] flex gap-3 overflow-x-auto px-3 [scrollbar-width:none] lg:mt-[176px] desktop:mx-0 desktop:justify-between desktop:gap-0 desktop:overflow-visible desktop:px-0">
      {SUPPLY_CHAIN.links.map((link, index) => (
        <li
          key={index}
          className={`flex w-[191px] shrink-0 flex-col gap-3.5 rounded-[5px] border border-white p-2.5 pt-[11px] font-mono text-xs leading-[1.35] font-semibold uppercase ${
            index === 0 ? 'bg-white text-black' : 'text-white'
          }`}
        >
          <p>{link.label}</p>
          <p className="whitespace-pre-line">{link.body}</p>
        </li>
      ))}
    </ol>
  )
}

function Facts() {
  return (
    <div className="flex flex-col gap-[22px] font-mono text-xs leading-[1.3] uppercase">
      <p className={`font-medium ${TRIM}`}>{SUPPLY_CHAIN.intro}</p>
      {SUPPLY_CHAIN.facts.map((fact) => (
        <div key={fact.label} className="flex flex-col items-start gap-2">
          <p className={`border-b border-white pb-[3.5px] font-bold ${TRIM}`}>
            {fact.label}
          </p>
          <p className={`lg:whitespace-pre-line ${TRIM}`}>{fact.body}</p>
        </div>
      ))}
      <p className={`font-bold ${TRIM}`}>{SUPPLY_CHAIN.outro}</p>
    </div>
  )
}

function Stats() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-[17px]">
      {SUPPLY_CHAIN.stats.map((stat) => (
        <div
          key={stat.label}
          className="flex h-[131px] w-full flex-col justify-between rounded-[5px] bg-[#404040] px-5 py-2.5 leading-[1.35] uppercase sm:w-[291px]"
        >
          <p className="font-mono text-xs font-semibold">{stat.label}</p>
          <p className="font-display text-[50px] font-semibold">{stat.value}</p>
          <p className="font-mono text-[9px]">{stat.note}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Figma draws this panel with its Glass effect: a near-black pane with a
 * hairline lit from the top left. The graph sits on it with Lighten blending.
 * On phones the graph keeps a legible size and scrolls sideways instead.
 */
function IdentityGraph() {
  return (
    <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] desktop:mx-0 desktop:overflow-visible desktop:px-0">
      <div className="relative aspect-[803/409] w-full min-w-[640px] rounded-[5px] border border-t-white/30 border-r-white/[0.18] border-b-white/[0.16] border-l-white/25 bg-black/90 desktop:aspect-auto desktop:h-[409px] desktop:w-[803px]">
        <div className="absolute inset-x-[15px] inset-y-[14px] mix-blend-lighten">
          <Image
            src="/images/prifi/identity-graph.webp"
            alt={SUPPLY_CHAIN.graphAlt}
            fill
            sizes="(min-width: 1440px) 771px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  )
}
