import { WE_ALL_PAY } from '../_content'

import {
  Column,
  Exhibit,
  Panel,
  Prose,
  SectionHeading,
  Standfirst,
} from './atoms'

/** Figma sets body copy on this panel a shade off the heading ink. */
const BODY_INK = 'text-[#fafaf7]'

export function WeAllPay() {
  return (
    <Panel className="rounded-[30px] bg-accent-steel-teal text-brand-off-white">
      <Column>
        <SectionHeading>
          {WE_ALL_PAY.heading}
        </SectionHeading>

        <Standfirst lines={WE_ALL_PAY.standfirstLines} />

        {WE_ALL_PAY.bodyBeforeExhibit.map((paragraph, index) => (
          <Prose key={`before-${index}`} className={BODY_INK}>
            {paragraph}
          </Prose>
        ))}

        <Exhibit {...WE_ALL_PAY.exhibit03} />

        {WE_ALL_PAY.bodyAfterExhibit.map((paragraph, index) => (
          <Prose key={`after-${index}`} className={BODY_INK}>
            {paragraph}
          </Prose>
        ))}
      </Column>
    </Panel>
  )
}
