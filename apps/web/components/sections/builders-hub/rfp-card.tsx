import Image from 'next/image'

import type { Rfp } from '@repo/content/loaders'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

type Props = {
  rfp: Rfp
}

/**
 * Single RFP card on the Builders Hub home grid (Figma 40009046:24016 et al).
 *
 * Geometry: 345 × 317, rounded-12, 1 px dark-green/50 border. Title top-left,
 * CTA below, image bottom-right, description bottom-left. Body copy comes
 * from `tagline` (with `summary` as fallback).
 */
export function RfpCard({ rfp }: Props) {
  const detailHref = `${ROUTES.rfps}/${rfp.slug}`
  const blurb = rfp.tagline ?? rfp.summary

  return (
    <Link
      href={detailHref}
      className="group relative block h-[317px] w-full overflow-hidden rounded-[12px] border border-brand-dark-green/50 bg-brand-off-white transition-colors hover:bg-gray-01 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green md:w-[345px] md:shrink-0"
    >
      {/* Title */}
      <div className="absolute left-4 top-4 w-[249px]">
        <h3 className="font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.01em] text-brand-dark-green">
          {rfp.title}
        </h3>
      </div>

      {/* CTA */}
      <span className="absolute left-4 top-[83px] inline-flex items-center justify-center text-brand-dark-green">
        <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-[2px]">
          Learn More
        </span>
      </span>

      {/* Image */}
      {rfp.image ? (
        <div
          className="absolute right-2.5 bottom-3 w-[96px]"
          style={{ height: rfp.image.height }}
        >
          <Image
            src={rfp.image.src}
            alt={rfp.image.alt}
            width={rfp.image.width}
            height={rfp.image.height}
            className="size-full object-contain"
          />
        </div>
      ) : null}

      {/* Description */}
      <p className="absolute left-4 bottom-4 w-[186px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
        {blurb}
      </p>
    </Link>
  )
}
