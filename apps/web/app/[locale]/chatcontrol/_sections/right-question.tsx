import { RIGHT_QUESTION } from '../_content'

import {
  Column,
  Exhibit,
  Panel,
  Prose,
  SectionHeading,
  Standfirst,
} from './atoms'

export function RightQuestion() {
  return (
    <Panel className="bg-brand-off-white text-brand-dark-green">
      <Column>
        <SectionHeading>
          {RIGHT_QUESTION.heading}
        </SectionHeading>

        <Standfirst lines={RIGHT_QUESTION.standfirstLines} />

        <Prose>{RIGHT_QUESTION.intro}</Prose>

        <Exhibit {...RIGHT_QUESTION.exhibit04} />

        {RIGHT_QUESTION.body.map((paragraph, index) => (
          <Prose key={`body-${index}`}>{paragraph}</Prose>
        ))}
      </Column>
    </Panel>
  )
}
