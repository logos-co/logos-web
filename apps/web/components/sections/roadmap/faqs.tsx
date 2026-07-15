import type { RoadmapCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

interface RoadmapFaqsProps {
  data: RoadmapCopySection['faqs']
}

export function RoadmapFaqs({ data }: RoadmapFaqsProps) {
  return (
    <section className="relative mt-20 mb-10 bg-brand-off-white py-28 before:absolute before:top-0 before:left-0 before:h-px before:w-full before:bg-brand-dark-green/10 before:content-[''] desktop:mt-10">
      <ContentWidth>
        <h2 className="text-h3-serif text-brand-dark-green [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {data.heading}
        </h2>

        <div className="mt-[43px] flex flex-col">
          {data.items.map((item, index) => (
            <div
              key={item.question}
              className={`grid gap-6 px-3 py-3 lg:max-desktop:grid-cols-[305px_minmax(0,1fr)] lg:gap-0 lg:p-0 desktop:grid-cols-[704px_712px] ${
                index % 2 === 0 ? 'bg-black/10' : 'bg-black/5'
              }`}
            >
              <h3 className="text-body-serif text-brand-dark-green lg:p-3">
                {item.question}
              </h3>
              <div className="text-mono-s flex w-full max-w-[640px] flex-col gap-[13px] text-brand-dark-green lg:max-w-none lg:px-[200px] lg:py-3">
                {item.answer.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
