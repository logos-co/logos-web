import type { ReactNode } from 'react'

import type { CTA } from '@repo/content/schemas'

import { Button } from '@/components/ui'

type Props = {
  title: ReactNode
  eyebrow?: string
  topRightCta?: CTA
}

/**
 * Shared 3-column header used across the RFPs, Ideas, and Resources sections.
 *
 * Desktop (md+): title left, eyebrow at column 7, top-right CTA at column 11.
 * Mobile:        title left, eyebrow + CTA stacked under it on the right edge.
 */
export function BuildersHubSectionHeader({
  title,
  eyebrow,
  topRightCta,
}: Props) {
  return (
    <div className="relative w-full">
      {/* Title — same row on every breakpoint */}
      <p className="text-h3-serif text-brand-dark-green leading-none">
        {title}
      </p>

      {/* Desktop layout — absolute, matches Figma x-coords */}
      <div className="absolute inset-0 hidden md:block">
        {eyebrow ? (
          <p className="font-mono text-xs leading-[1.3] text-black absolute top-[3px] left-[50%] translate-x-[6px] w-[226px]">
            {eyebrow}
          </p>
        ) : null}
        {topRightCta ? (
          <div className="absolute top-0 left-[83.33%] translate-x-[2px]">
            <Button
              href={topRightCta.href}
              variant="link"
              {...(topRightCta.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {topRightCta.label}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Mobile layout — eyebrow + CTA stacked on the right side */}
      <div className="absolute top-0 right-3 flex flex-col items-start gap-6 md:hidden w-[178px] text-right">
        {eyebrow ? (
          <p className="font-mono text-xs leading-[1.3] text-black w-full">
            {eyebrow}
          </p>
        ) : null}
        {topRightCta ? (
          <Button
            href={topRightCta.href}
            variant="link"
            {...(topRightCta.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {topRightCta.label}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
