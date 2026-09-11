import ContentWidth from '@/components/layout/content-width'
import NetworkingFeatures from '@/components/sections/networking/networking-features'

import { GATHERING, SECTION_IDS } from '../_content'
import { SectionHeading } from './atoms'

/** The photos are cropped to the Figma frames, so they sit centred. */
const IMAGE_POSITIONS = ['object-center', 'object-center', 'object-center']

/**
 * Networking feature cards at Figma's 500px card: 12px padding, a fixed
 * 130px copy block, 17px gap, then the photo filling the rest. The fixed
 * heights only hold at the 1440 canvas; narrower columns keep the networking
 * layout so the copy never runs into the photo.
 */
export function Gathering() {
  return (
    <section id={SECTION_IDS.activities} className="mt-20 scroll-mt-12">
      <ContentWidth>
        <SectionHeading>{GATHERING.heading}</SectionHeading>
      </ContentWidth>
      <div className="mt-9">
        <NetworkingFeatures
          data={GATHERING}
          imagePositionClassNames={IMAGE_POSITIONS}
          classNames={{
            card: 'flex min-h-[358px] w-full shrink-0 flex-col items-start justify-between gap-[17px] rounded-3xl bg-gray-01 p-3 md:max-desktop:h-full md:max-desktop:min-h-[396px] desktop:h-[500px] desktop:justify-start',
            body: 'flex w-full flex-col gap-3 p-3 desktop:h-[130px]',
            description:
              'text-mono-s whitespace-pre-line text-brand-dark-green',
            footer: 'flex w-full flex-col desktop:flex-1',
            media:
              'relative h-[202px] w-full overflow-hidden rounded-[18px] md:max-desktop:h-62 desktop:flex-1',
          }}
        />
      </div>
    </section>
  )
}
