import ContentWidth from '@/components/layout/content-width'
import { ReleaseModuleRow } from '@/components/sections/roadmap/release'

import { TIMELINE } from '../_content'
import { SectionHeading } from './atoms'

/**
 * Row entries split 714 / 464 / 238 across the 1416px row, as in Figma. The
 * event copy runs into the empty last column, as Figma's unwrapped text does.
 */
export function Timeline() {
  return (
    <section className="mt-28">
      <ContentWidth className="!px-0">
        <SectionHeading className="px-3">{TIMELINE.heading}</SectionHeading>
        <div className="mt-9 md:grid md:grid-cols-[714fr_464fr_238fr] md:gap-x-3">
          {TIMELINE.rows.map((row, index) => (
            <ReleaseModuleRow
              key={row.date}
              module={{ label: row.date, body: row.event, actions: [] }}
              index={index}
              bodyClassName="font-mono-body text-xs leading-[1.3] whitespace-pre-line md:col-span-2"
            />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
