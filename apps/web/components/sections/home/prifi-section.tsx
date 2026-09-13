import Image from 'next/image'

import type { HomePrifiSection } from '@repo/content/schemas'

import { StackCard } from '@/components/motion/stack-card'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

/**
 * @figma-node 1014:1501
 *
 * The PriFi module: the pill artwork beside a centred statement and the link
 * to the PriFi page. Stacks under the Decide card like its neighbours.
 */
export default function PrifiSection({ data }: { data: HomePrifiSection }) {
  return (
    <StackCard
      rise={180}
      className="relative z-[4] -mt-[180px] overflow-clip rounded-t-[36px] bg-gray-01 text-brand-dark-green"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-12 px-3 pt-[88px] pb-[200px] desktop:flex-row desktop:justify-between desktop:gap-0 desktop:px-[131px] desktop:pt-[112px] desktop:pb-[224px]">
        <div className="flex w-full shrink-0 justify-center desktop:h-[479px] desktop:w-[583px] desktop:justify-start desktop:pt-[29px] desktop:pl-[161px]">
          <div className="relative h-[300px] w-[208px] shrink-0 overflow-hidden rounded-full md:h-[421px] md:w-[292px]">
            <Image
              src="/images/prifi/pill.webp"
              alt=""
              fill
              sizes="292px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-10 text-center desktop:w-[595px]">
          <h2 className="font-display text-[32px] leading-none tracking-[-0.02em] whitespace-pre-line md:text-[36px]">
            {data.headline}
          </h2>
          <div className="font-display text-[20px] leading-[1.1] tracking-[-0.01em] md:text-[24px] desktop:w-[510px]">
            <p>{data.bodyParts[0]}</p>
            {/* Figma's blank line between the paragraphs, plus its 10.375px
                paragraph spacing on each side of it. */}
            <p className="mt-[1.96em]">{data.bodyParts[1]}</p>
          </div>
          <Button href={ROUTES.prifi} className="cursor-pointer">
            {data.cta}
          </Button>
        </div>
      </div>
    </StackCard>
  )
}
