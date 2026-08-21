import { DOES_NOT_CATCH } from '../_content'

import {
  Column,
  Exhibit,
  Panel,
  Prose,
  ProseGroup,
  SectionHeading,
  Standfirst,
  TRIM,
} from './atoms'
import { SearchShiftChart } from './search-shift-chart'

export function DoesNotCatch() {
  return (
    <Panel className="bg-brand-off-white text-brand-dark-green">
      <Column>
        <SectionHeading eyebrow={DOES_NOT_CATCH.eyebrow}>
          {DOES_NOT_CATCH.heading}
        </SectionHeading>

        <Prose>{DOES_NOT_CATCH.intro}</Prose>

        <Exhibit {...DOES_NOT_CATCH.exhibit01} />

        <ProseGroup paragraphs={DOES_NOT_CATCH.afterExhibit01} />

        <Exhibit {...DOES_NOT_CATCH.exhibit02} />

        <Prose>{DOES_NOT_CATCH.afterExhibit02}</Prose>

        <hr className="w-full border-t border-gray-02" />

        <div className="flex flex-col gap-6 md:gap-[30px]">
          <h3
            className={`font-display ${TRIM} text-[22px] leading-none tracking-[-0.03em] md:text-[26px]`}
          >
            {DOES_NOT_CATCH.studyHeading}
          </h3>
          <ProseGroup paragraphs={DOES_NOT_CATCH.studyBody} />
        </div>

        <SearchShiftChart />

        <Standfirst lines={DOES_NOT_CATCH.closingLines} />
      </Column>
    </Panel>
  )
}
