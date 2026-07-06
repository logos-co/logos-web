import type { GetStartedCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { ButtonArrowIcon } from '@/components/ui/button'
import { EXTERNAL_URLS } from '@/constants/routes'

import { SectionHeading } from './atoms'
import type { CommunityLink } from './types'

const communityLinks: readonly CommunityLink[] = [
  { key: 'forum', href: EXTERNAL_URLS.forum },
  { key: 'research', href: EXTERNAL_URLS.forum },
  { key: 'discord', href: EXTERNAL_URLS.discord },
  { key: 'xLogosNetwork', href: EXTERNAL_URLS.twitter },
  { key: 'xLogosDevs', href: EXTERNAL_URLS.twitterDevs },
  { key: 'youtubeTutorials', href: EXTERNAL_URLS.youtube },
] as const

export function Community({
  data,
}: {
  data: GetStartedCopySection['sections']['community']
}) {
  return (
    <section className="border-t border-brand-dark-green/10 pt-6 pb-25">
      <ContentWidth className="flex w-full flex-col gap-10">
        <SectionHeading
          number={data.number}
          heading={data.heading}
        />
        <div className="flex flex-col">
          {communityLinks.map((item, index) => (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex h-[62px] cursor-pointer items-center justify-between px-3 transition-colors hover:bg-accent-light-blue md:h-[50px] md:px-4 ${
                index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
              }`}
            >
              <span className="flex items-baseline gap-3 text-[14px] leading-[1.2]">
                <span className="font-sans font-medium">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-display">
                  {data.items[item.key]}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 border-b border-brand-dark-green/50 pb-0.5 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
                {data.cta}
                <ButtonArrowIcon />
              </span>
            </a>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
