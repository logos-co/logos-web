import { PROMISE } from '../_content'

import {
  Column,
  Panel,
  ProseGroup,
  SectionHeading,
} from './atoms'

export function LawsPromise() {
  return (
    // Figma inks this panel's heading and body in #fafaf7, a shade off the
    // brand-off-white token used elsewhere. No token matches it, so the design
    // value wins.
    <Panel className="rounded-[30px] bg-brand-dark-green text-[#fafaf7]">
      <Column>
        <SectionHeading>
          {PROMISE.heading}
        </SectionHeading>
        <ProseGroup paragraphs={PROMISE.body} />
      </Column>
    </Panel>
  )
}
