import type { Rfp } from '@repo/content/loaders'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import { formatRewardLines } from '@/lib/reward'

type Props = {
  index: number
  rfp: Rfp
}

/**
 * Compact row variant used by the RFPs listing in `list` view mode. Mirrors
 * the home Ideas table row pattern: index + title left, tagline middle,
 * reward + CTA right. Same alternating row backgrounds.
 */
export function RfpListRow({ index, rfp }: Props) {
  const indexLabel = index.toString().padStart(2, '0')
  const isOdd = index % 2 === 1
  const bg = isOdd ? 'bg-gray-01' : 'bg-brand-dark-green/5'
  const detailHref = `${ROUTES.rfps}/${rfp.slug}`
  const blurb = rfp.tagline ?? rfp.summary
  const rewardLines = formatRewardLines(rfp.reward)

  return (
    <li className={`${bg} relative w-full`}>
      <Link
        href={detailHref}
        className="group block transition-colors hover:bg-brand-dark-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
      >
        {/* Mobile */}
        <div className="relative h-[116px] md:hidden">
          <p className="absolute top-3 left-3 w-[179px] font-sans text-[14px] leading-[1.2] text-brand-dark-green">
            <span className="font-medium">{indexLabel}</span>
            <span className="ml-3 font-display">{rfp.title}</span>
          </p>
          <p className="absolute top-[75px] left-3 w-[179px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {blurb}
          </p>
          <span className="absolute top-3 right-[22px] inline-flex items-center justify-center border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green">
            <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap">
              Learn More
            </span>
          </span>
          {rewardLines.length > 0 ? (
            <p className="absolute top-[75px] right-3 w-[83px] font-mono text-[10px] leading-[1.3] text-brand-dark-green text-left">
              {rewardLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          ) : null}
        </div>

        {/* Desktop */}
        <div className="relative hidden h-[50px] md:block">
          <div className="absolute top-3 left-3 flex items-baseline gap-3">
            <span className="font-sans text-[14px] font-normal leading-[1.2] text-brand-dark-green w-[18px]">
              {indexLabel}
            </span>
            <span className="font-display text-[14px] leading-[1.2] text-brand-dark-green whitespace-nowrap">
              {rfp.title}
            </span>
          </div>
          <p className="absolute top-3 left-[50%] translate-x-[6px] w-[464px] font-mono text-[10px] leading-[1.3] text-brand-dark-green truncate">
            {blurb}
          </p>
          <div className="absolute top-3 left-[83.33%] translate-x-[2px] flex items-start gap-3">
            {rewardLines.length > 0 ? (
              <span className="w-[107px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
                {rewardLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            ) : (
              <span className="w-[107px]" />
            )}
            <span className="inline-flex items-center justify-center text-brand-dark-green">
              <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-0.5">
                Learn More
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}
