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
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 py-10 text-brand-dark-green min-[1025px]:min-h-[670px]">
      <ContentWidth className="grid gap-10 min-[1025px]:grid-cols-12 min-[1025px]:gap-3">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] min-[1025px]:col-span-3">
          {title}
        </h2>
        <div className="text-mono-s space-y-[13px] min-[1025px]:col-span-3 min-[1025px]:col-start-7 min-[1025px]:max-w-[345px]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="min-[1025px]:col-span-2 min-[1025px]:col-start-11 min-[1025px]:justify-self-start">
          <LinkButton {...cta} />
        </div>
      </ContentWidth>
    </section>
  )
}
