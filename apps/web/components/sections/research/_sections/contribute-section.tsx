import type { ReactNode } from 'react'

import ContentWidth from '@/components/layout/content-width'

import { TextLink } from './atoms'
import type { ContributeCopy } from './types'

export function ContributeSection({
  title,
  copy,
  contact,
  jobs,
}: {
  title: string
  copy: ContributeCopy
  contact: ReactNode
  jobs: ReactNode
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 py-10 text-brand-dark-green md:min-h-[262px]">
      <ContentWidth className="grid gap-10 md:grid-cols-12 md:gap-3">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] md:col-span-3">
          {title}
        </h2>
        <div className="text-mono-s md:col-span-4 md:col-start-7 md:w-[345px]">
          <p className="font-bold">{copy.howTitle}</p>
          <p>{contact}</p>
          <p className="mt-[13px]">{jobs}</p>
          <p className="mt-6.5 font-bold">{copy.whatTitle}</p>
          <p>{copy.whatBody}</p>
          <p className="mt-6.5">{copy.codeIntro}</p>
          <ul className="list-disc pl-5">
            {copy.codeLinks.map((link) => (
              <li key={link.href}>
                <TextLink href={link.href} label={link.label}>
                  {link.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </div>
      </ContentWidth>
    </section>
  )
}
