import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { SUPPLY_CHAIN, SUPPLY_CHAIN_ID } from '../_content'
import { ChainExplorer } from './chain-explorer'

/** Figma's section height, which the baked glow image is cut to. */
const GLOW_HEIGHT = 'h-[1406px]'

export function SupplyChain() {
  return (
    <section
      id={SUPPLY_CHAIN_ID}
      className="relative overflow-hidden bg-black pt-[88px] pb-[87px] text-white lg:pt-[142px] desktop:pb-[54px]"
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

      <ContentWidth className="relative">
        <Intro />
        <ChainExplorer />
      </ContentWidth>
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
          <p className="text-xs leading-[1.4] lg:w-[476px]">
            {SUPPLY_CHAIN.note}
          </p>
        </div>
      </div>
    </div>
  )
}
