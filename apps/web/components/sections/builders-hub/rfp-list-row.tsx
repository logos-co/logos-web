import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import type { RfpListItem } from '@/lib/rfp-types'
import { formatRewardLines } from '@/lib/reward'

type Props = {
  index: number
  rfp: RfpListItem
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
        {/* Mobile / tablet (below 1025px): 2-column flow grid so a long title
            pushes the description down instead of overlapping it. */}
        <div className="grid min-h-[116px] grid-cols-[1fr_auto] items-start gap-x-3 gap-y-3 p-3 min-[1025px]:hidden">
          <p className="font-sans text-[14px] leading-[1.2] text-brand-dark-green">
            <span className="font-medium">{indexLabel}</span>
            <span className="ml-3 font-display">{rfp.title}</span>
          </p>
          <span className="inline-flex items-center justify-center justify-self-end border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green">
            <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap">
              Learn More
            </span>
          </span>
          <p className="font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {blurb}
          </p>
          {rewardLines.length > 0 ? (
            <p className="w-[83px] justify-self-end font-mono text-[10px] leading-[1.3] text-brand-dark-green">
              {rewardLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          ) : null}
        </div>

        {/* Desktop (1025px+): single flex row. The reward + CTA block is
            shrink-0 so it always stays inside the table; title and description
            truncate as the window narrows. */}
        <div className="hidden h-[50px] items-start gap-3 px-3 pt-3 min-[1025px]:flex">
          <div className="flex w-1/2 min-w-0 items-baseline gap-3">
            <span className="w-[18px] shrink-0 font-sans text-[14px] font-normal leading-[1.2] text-brand-dark-green">
              {indexLabel}
            </span>
            <span className="min-w-0 truncate font-display text-[14px] leading-[1.2] text-brand-dark-green">
              {rfp.title}
            </span>
          </div>
          <p className="min-w-0 flex-1 truncate font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {blurb}
          </p>
          <div className="flex shrink-0 items-start gap-3">
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
