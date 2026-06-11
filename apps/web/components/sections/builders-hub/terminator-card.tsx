import Image from 'next/image'

import type { BuilderHubHomeTerminator } from '@repo/content/loaders'

import { Link } from '@/i18n/navigation'

type Props = {
  terminator: BuilderHubHomeTerminator
}

/**
 * "See all ideas / RFPs" terminator card. Replaces the last grid cell in the
 * RFP / Idea grid with a card that previews 1–4 thumbnails of the linked
 * collection (Figma 40009046:24066). Click → see-all listing route.
 */
export function TerminatorCard({ terminator }: Props) {
  const items =
    terminator.kind === 'see-all-ideas'
      ? terminator.thumbnailIdeas
      : terminator.thumbnailRfps
  const thumbnails = items
    .filter((item) => item.image !== undefined)
    .slice(0, 4)

  return (
    <Link
      href={terminator.href}
      className="relative block w-[345px] h-[317px] rounded-[12px] border border-brand-dark-green/50 overflow-hidden bg-brand-off-white shrink-0 cursor-pointer md:w-full"
    >
      {/* Title */}
      <h3 className="absolute left-4 top-4 w-[249px] font-sans text-[24px] font-normal leading-[1.1] tracking-tight text-brand-dark-green">
        {terminator.title}
      </h3>

      {/* Stack of up to 4 thumbnails — Figma frame 1244830645 (-26, 178, 402, 127) */}
      <div className="absolute top-[178px] -left-[26px] flex items-end gap-1.5 w-[402px]">
        {thumbnails.map((item) =>
          item.image ? (
            <Image
              key={item.slug}
              src={item.image.src}
              alt={item.image.alt}
              width={item.image.width}
              height={item.image.height}
              className="w-[96px] h-auto object-contain shrink-0"
            />
          ) : null
        )}
      </div>
    </Link>
  )
}
