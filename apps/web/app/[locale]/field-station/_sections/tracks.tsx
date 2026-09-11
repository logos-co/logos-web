import { IconMask } from '@/components/icons/icon-mask'
import { AccordionPanelSection } from '@/components/sections/home/about-section'

import { SECTION_IDS, TRACKS } from '../_content'

const CHEVRON = (
  <IconMask
    src="/campaigns/field-station/chevron-down.svg"
    className="size-6 text-white"
  />
)

/**
 * The homepage's dark accordion panel set to the Figma frame: fully rounded,
 * a 60px title, 13px of air above and below each row and white hairlines.
 */
export function Tracks() {
  return (
    <AccordionPanelSection
      id={SECTION_IDS.tracks}
      heading={TRACKS.heading}
      items={[...TRACKS.items]}
      rise={0}
      className="mt-28 scroll-mt-12 rounded-[40px] lg:mt-28 lg:rounded-[100px]"
      contentClassName="pb-28 lg:px-[min(130px,9.03vw)] lg:pb-[164px]"
      headingClassName="text-h2-lg mx-auto max-w-[853px] text-center [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
      listClassName="mt-[112px]"
      accordionClassNames={{
        item: 'border-t border-white/20 last:border-b',
        row: 'flex w-full items-center justify-between gap-6 py-[30px] text-left md:py-[42.5px]',
        title:
          'text-h2 whitespace-pre-line text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]',
        subtitle:
          'text-mono-l hidden text-white/60 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] sm:inline desktop:whitespace-nowrap',
      }}
      accordionIcons={{ open: CHEVRON, closed: CHEVRON }}
    />
  )
}
