/**
 * Source list. Unlike the other bands this one runs almost edge to edge (12px
 * gutter in Figma, matching the site footer), so it does not use `Panel`.
 */
import { ExternalLink } from '@/components/ui'

import { CASE_FILE } from '../_content'

import { DimNote, TRIM } from './atoms'
import { TypewriterHeading } from './typewriter'

export function CaseFile() {
  return (
    <section className="bg-brand-dark-green text-brand-off-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-3 pt-14 pb-[46px] md:gap-[60px] md:pt-20">
        <div className="flex flex-col gap-[18px]">
          <TypewriterHeading className={`text-h2 ${TRIM}`}>
            {CASE_FILE.heading}
          </TypewriterHeading>
          <DimNote lines={CASE_FILE.noteLines} />
        </div>

        <ol className="flex w-full flex-col border-b border-brand-off-white/15">
          {CASE_FILE.sources.map((source) => (
            <li
              key={source.index}
              className="flex gap-4 border-t border-brand-off-white/15 py-[18px] font-mono text-[13px] leading-[1.15] tracking-[-0.01em] md:gap-10 md:text-[15px]"
            >
              <span className="shrink-0">{source.index}</span>
              <ExternalLink
                href={source.href}
                className="cursor-pointer decoration-[1px] underline-offset-[3px] transition-opacity hover:underline hover:opacity-70 focus-visible:underline"
              >
                {source.text}
              </ExternalLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
