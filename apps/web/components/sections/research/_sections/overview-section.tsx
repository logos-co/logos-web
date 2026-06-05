import type { ReactNode } from 'react'

import ContentWidth from '@/components/layout/content-width'

import { LinkButton } from './atoms'
import type { LinkItem } from './types'

export function OverviewSection({
  title,
  paragraphs,
  cta,
}: {
  title: string
  paragraphs: ReactNode[]
  cta: LinkItem
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 py-10 text-brand-dark-green md:min-h-[670px]">
      <ContentWidth className="grid gap-10 md:grid-cols-12 md:gap-3">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] md:col-span-3">
          {title}
        </h2>
        <div className="text-mono-s space-y-[13px] md:col-span-3 md:col-start-7 md:w-[345px]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="md:col-span-2 md:col-start-11 md:justify-self-start">
          <LinkButton {...cta} />
        </div>
      </ContentWidth>
    </section>
  )
}
