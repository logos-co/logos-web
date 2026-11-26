import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'
import { FaqAccordion } from './faq-accordion'

import { ProgrammeWidth } from './layout'
import { ProgrammeButton } from './button'

interface NodeProgrammeFaqsProps {
  data: NodeReferralProgrammeCopySection['faqs']
}

export function NodeProgrammeFaqs({ data }: NodeProgrammeFaqsProps) {
  return (
    <section
      className="bg-accent-steel-teal/20 py-16 md:py-25"
      aria-labelledby="node-programme-faqs"
    >
      <ProgrammeWidth className="grid gap-10 lg:grid-cols-2 lg:gap-3">
        <div>
          <h2 id="node-programme-faqs" className="text-h1 whitespace-pre-line">
            {data.title}
          </h2>
          <ProgrammeButton
            href={data.cta.href}
            variant="tertiary"
            className="mt-6 cursor-pointer"
          >
            {data.cta.label}
          </ProgrammeButton>
        </div>
        <FaqAccordion items={data.items} />
      </ProgrammeWidth>
    </section>
  )
}
