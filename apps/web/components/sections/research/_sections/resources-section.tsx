import ContentWidth from '@/components/layout/content-width'

import { LinkButton } from './atoms'
import type { ResourceItem } from './types'

export function ResourcesSection({
  title,
  learnMoreLabel,
  items,
}: {
  title: string
  learnMoreLabel: string
  items: ResourceItem[]
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white text-brand-dark-green">
      <ContentWidth className="grid px-3 py-10 md:grid-cols-12">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] md:col-span-3">
          {title}
        </h2>
      </ContentWidth>
      <ContentWidth>
        {items.map((item, index) => (
          <div
            key={item.number}
            className={
              index % 2 === 0
                ? 'bg-brand-dark-green/5'
                : 'bg-[var(--color-gray-01)]'
            }
          >
            <div className="grid min-h-[50px] items-start gap-4 px-3 py-3 md:grid-cols-12 md:gap-3">
              <div className="flex items-baseline gap-3 md:col-span-6">
                <span className="w-[18px] shrink-0 text-[14px] font-medium leading-[1.2]">
                  {item.number}
                </span>
                <span className="font-display text-[14px] leading-[1.2]">
                  {item.label}
                </span>
              </div>
              <div className="md:col-span-2 md:col-start-11">
                <LinkButton label={item.cta ?? learnMoreLabel} href={item.href} />
              </div>
            </div>
          </div>
        ))}
      </ContentWidth>
    </section>
  )
}
