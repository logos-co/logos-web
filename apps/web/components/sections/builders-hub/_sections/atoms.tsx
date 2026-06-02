/**
 * Shared presentational atoms for the Builders Hub home page sections.
 */
import type { ReactNode } from 'react'

import ContentWidth from '@/components/layout/content-width'

export function SectionFrame({
  id,
  index,
  title,
  children,
}: {
  id: string
  index: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="border-t border-brand-dark-green/10 px-3 pt-6 pb-25"
    >
      <ContentWidth>
        <div className="flex items-baseline gap-3 whitespace-nowrap">
          <span className="font-display text-[30px] leading-none tracking-[-0.03em] text-brand-dark-green/50 md:text-[36px]">
            {index}
          </span>
          <h2 className="text-[30px] leading-none tracking-[-0.02em] md:text-h3-sans">
            {title}
          </h2>
        </div>
        <div className="mt-10">{children}</div>
      </ContentWidth>
    </section>
  )
}

export function externalProps(cta: { external?: boolean }) {
  return cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}
