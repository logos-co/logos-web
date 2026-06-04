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
    <section id={id} className="border-t border-brand-dark-green/10 pt-6 pb-25">
      <ContentWidth>
        <h2 className="flex items-baseline gap-3 text-[24px] leading-[1.1] tracking-[-0.24px] whitespace-nowrap">
          <span className="font-display text-brand-dark-green/50">{index}</span>
          <span className="font-sans text-brand-dark-green">{title}</span>
        </h2>
        <div className="mt-10">{children}</div>
      </ContentWidth>
    </section>
  )
}

export function externalProps(cta: { external?: boolean }) {
  return cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}
