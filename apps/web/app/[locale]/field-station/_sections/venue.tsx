import Image from 'next/image'

import { BuilderPortalLayout } from '@/components/sections/home/builder-portal-section'

import { SECTION_IDS, VENUE } from '../_content'
import { SectionHeading } from './atoms'

/**
 * Figma centres the copy block (with an empty 117px frame under it) on the
 * 940×532 photo, so the copy sits in the `heading` slot and the column is
 * centred rather than spread.
 */
export function Venue() {
  return (
    <BuilderPortalLayout
      id={SECTION_IDS.venue}
      className="mt-20 scroll-mt-12 bg-brand-off-white"
      contentClassName="py-0"
      columnClassName="desktop:min-h-[532px] desktop:justify-center flex flex-col gap-10"
      heading={
        <div className="flex flex-col gap-[19px] desktop:pb-[136px]">
          <SectionHeading>{VENUE.heading}</SectionHeading>
          <div className="text-mono-s desktop:w-[345px] flex flex-col gap-8 text-brand-dark-green">
            {VENUE.blocks.map((block) => (
              <div key={block.label}>
                <p className="font-bold">{block.label}</p>
                <div className="flex flex-col gap-4">
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      media={
        <>
          <Image
            src={VENUE.image.src}
            alt={VENUE.image.alt}
            fill
            sizes="(max-width: 1024px) calc(100vw - 24px), (max-width: 1440px) calc(66.67vw - 20px), 940px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-radial-[170.8%_50%_at_50%_50%] from-black/0 via-brand-dark-green/50 via-50% to-brand-dark-green opacity-50" />
        </>
      }
    />
  )
}
