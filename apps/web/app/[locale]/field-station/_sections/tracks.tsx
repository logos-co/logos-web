import { IconMask } from '@/components/icons/icon-mask'
import { AccordionPanelSection } from '@/components/sections/home/about-section'

import { EVENT_NAMES, SECTION_IDS, TRACKS, type TrackBlock } from '../_content'
import { LinkedText } from './atoms'

const CHEVRON = (
  <IconMask
    src="/campaigns/field-station/chevron-down.svg"
    className="size-6 text-white"
  />
)

/**
 * Figma's expanded track (frame 12:524) is one 14px text block with a blank
 * line between paragraphs. Idea titles are set as plain document headings:
 * bold, no underline, with a little space before their paragraph.
 */
function TrackDetails({ blocks }: { blocks: readonly TrackBlock[] }) {
  return blocks.map((block) => (
    <p key={block.text}>
      {block.heading ? (
        <strong className="mb-1.5 block font-bold">{block.heading}</strong>
      ) : null}
      <LinkedText text={block.text} link={block.link} />
    </p>
  ))
}

const ITEMS = TRACKS.items.map(({ details, ...item }) => ({
  ...item,
  eventName: EVENT_NAMES.trackToggle(item.title.replace('\n', ' ')),
  content: <TrackDetails blocks={details} />,
}))

/**
 * The homepage's dark accordion panel set to the Figma frame: fully rounded,
 * a 60px title, 13px of air above and below each row and white hairlines.
 * The tracks start closed, as the page frame draws them.
 */
export function Tracks() {
  return (
    <AccordionPanelSection
      id={SECTION_IDS.tracks}
      heading={TRACKS.heading}
      items={ITEMS}
      rise={0}
      className="mt-28 scroll-mt-12 rounded-[40px] lg:mt-28 lg:rounded-[100px]"
      contentClassName="pb-28 lg:px-[min(130px,9.03vw)] lg:pb-[164px]"
      headingClassName="text-h2-lg mx-auto max-w-[853px] text-center [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
      listClassName="mt-[112px]"
      accordionClassNames={{
        item: 'border-t border-white/20 last:border-b',
        // An open panel takes 4px from the row and gives it back as panel
        // padding, so the trimmed first line keeps Figma's position while its
        // ascenders stay inside the panel's overflow clip.
        row: 'flex w-full items-center justify-between gap-6 py-[30px] text-left aria-expanded:pb-[26px] md:py-[42.5px] md:aria-expanded:pb-[38.5px]',
        title:
          'text-h2 whitespace-pre-line text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]',
        subtitle:
          'text-mono-l hidden text-white/60 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] sm:inline desktop:whitespace-nowrap',
        panel:
          'flex flex-col gap-8 pt-1 pb-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12 lg:pb-[60px]',
        body: 'text-body-sans text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [&>p+p]:mt-[1.2em]',
      }}
      accordionIcons={{ open: CHEVRON, closed: CHEVRON }}
      accordionInitialOpenKey={null}
    />
  )
}
