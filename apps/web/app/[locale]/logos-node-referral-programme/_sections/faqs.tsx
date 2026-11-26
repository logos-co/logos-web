import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'
import { FaqCloseIcon, FaqOpenIcon } from '@acid-info/logos-ui'

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
        <div>
          {data.items.map((item, index) => (
            <details
              key={item.question}
              name="node-programme-faq"
              open={index === 0}
              className="group border-t border-brand-dark-green/35 last:border-b"
            >
              <summary className="cursor-pointer list-none py-[18px] group-open:py-[13px] focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
                <h3 className="flex min-h-6 items-center justify-between gap-6 font-sans text-lg leading-[1.15] tracking-[-0.01em]">
                  {item.question}
                  <FaqOpenIcon className="shrink-0 group-open:hidden" />
                  <FaqCloseIcon className="hidden shrink-0 group-open:block" />
                </h3>
              </summary>
              <p className="max-w-[600px] pb-6 font-sans text-sm leading-[1.2] text-brand-dark-green/85">
                {item.answer.map((part, partIndex) =>
                  part.href ? (
                    <a
                      key={partIndex}
                      href={part.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {part.text}
                    </a>
                  ) : (
                    part.text
                  )
                )}
              </p>
            </details>
          ))}
        </div>
      </ProgrammeWidth>
    </section>
  )
}
