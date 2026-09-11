import ContentWidth from '@/components/layout/content-width'
import CivilSocietyAccordion from '@/components/sections/home/civil-society-accordion'

import { FAQ } from '../_content'
import { SectionHeading } from './atoms'

const TOGGLE_CLASSNAME = 'text-eyebrow text-black'

/** The homepage accordion, restyled as Figma's grey question cards. */
export function Faq() {
  return (
    <section className="mt-28">
      <ContentWidth>
        <SectionHeading>{FAQ.heading}</SectionHeading>
        <div className="mt-6">
          <CivilSocietyAccordion
            items={FAQ.items}
            classNames={{
              root: 'flex w-full flex-col gap-3',
              item: 'rounded-xl bg-gray-01 p-3',
              row: 'flex w-full items-center justify-between gap-6 text-left',
              title: 'text-eyebrow text-black',
              aside: 'flex items-center',
              panel: 'pt-3',
              body: 'text-mono-s max-w-[422px] text-black',
            }}
            icons={{
              open: <span className={TOGGLE_CLASSNAME}>-</span>,
              closed: <span className={TOGGLE_CLASSNAME}>+</span>,
            }}
          />
        </div>
      </ContentWidth>
    </section>
  )
}
