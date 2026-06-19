import Image from 'next/image'

import type { Idea } from '@repo/content/loaders'

import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

type Props = {
  idea: Idea
}

/**
 * Grid-view card for the Ideas listing page. Mirrors the RFP card geometry
 * (345 × 317, rounded-12, 1 px border) but renders the idea's submitter line
 * and a Discuss CTA that links to the idea detail page.
 */
export function IdeaCard({ idea }: Props) {
  const detailHref = `${ROUTES.ideas}/${idea.slug}`
  const blurb = idea.tagline ?? idea.summary

  return (
    <article className="relative w-full h-[317px] rounded-[12px] border border-brand-dark-green/50 overflow-hidden bg-brand-off-white shrink-0">
      {/* Title + CTA — flow column so long titles push the CTA down instead
          of overlapping it; min-h reserves the 2-line slot from the design. */}
      <div className="absolute left-4 top-4 w-[249px]">
        <Link href={detailHref} className="block cursor-pointer">
          <h3 className="min-h-[2.2em] font-sans text-[24px] font-normal leading-[1.1] tracking-tight text-brand-dark-green">
            {idea.title}
          </h3>
        </Link>
        <div className="mt-[14.2px]">
          <Button href={detailHref} variant="link">
            {idea.ctaLabel ?? 'Discuss'}
          </Button>
        </div>
      </div>

      {idea.image ? (
        <div className="absolute right-2.5 bottom-3 w-[96px]">
          <Image
            src={idea.image.src}
            alt={idea.image.alt}
            width={idea.image.width}
            height={idea.image.height}
            className="size-full object-contain"
          />
        </div>
      ) : null}

      <p className="absolute left-4 bottom-4 w-[186px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
        {blurb}{' '}
        <span className="opacity-70">/ Idea by @{idea.submitter.handle}</span>
      </p>
    </article>
  )
}
