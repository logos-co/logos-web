import { HowItWorksSection } from '@/components/sections/basecamp/_sections/how-it-works-section'
import ContentWidth from '@/components/layout/content-width'

import {
  APPLICATION,
  APPLICATION_INTRO,
  EVENT_NAMES,
  SECTION_IDS,
} from '../_content'

/**
 * The Basecamp "How it works" block at Figma's 702/702 split. The photo keeps
 * the 702×626 frame ratio and the grid row stretches the copy column to it.
 */
export function Application() {
  return (
    <ContentWidth
      id={SECTION_IDS.applicationProcess}
      className="mt-28 scroll-mt-12 !p-0"
    >
      <HowItWorksSection
        data={APPLICATION}
        eventNames={[
          EVENT_NAMES.applicationApply,
          EVENT_NAMES.applicationInstall,
        ]}
        image={{ ...APPLICATION_INTRO.image, className: 'object-cover' }}
        classNames={{
          root: 'grid w-full gap-6 px-3 py-10 lg:grid-cols-2 lg:gap-3 lg:p-3',
          column: 'flex flex-col gap-6 lg:justify-between lg:gap-8',
          // Figma's 16px blank line sets the body a pixel higher than a
          // 16px margin does, so the column's glyphs land on its rows.
          title: 'text-h3-sans mb-[15px] text-brand-dark-green',
          intro: 'mb-[42px] flex flex-col gap-[42px] text-brand-dark-green',
          // Figma draws the rule inside the 31px row pitch; the border adds 1px.
          row: 'grid gap-4 pt-[5px] pb-3 lg:grid-cols-2 lg:gap-3',
          media: 'relative aspect-[702/626] overflow-hidden rounded-xl',
        }}
        intro={
          <>
            <p className="text-body-lg-sans max-w-[612px]">
              {APPLICATION_INTRO.bodyLines.map((line, index) => (
                <span key={line}>
                  {index > 0 ? (
                    <>
                      <span className="desktop:hidden"> </span>
                      <br className="hidden desktop:inline" />
                    </>
                  ) : null}
                  {line}
                </span>
              ))}
            </p>
            <p className="text-mono-s">{APPLICATION_INTRO.note}</p>
          </>
        }
      />
    </ContentWidth>
  )
}
