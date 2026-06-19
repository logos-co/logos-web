import type { Idea } from '@repo/content/loaders'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import { formatRewardLines } from '@/lib/reward'

type Props = {
  index: number
  idea: Idea
}

/**
 * Single Ideas-table row on the Builders Hub home (Figma desktop 40009046:24082,
 * mobile 40009046:23857) and the Ideas listing list view.
 *
 * Desktop: 50 px row, 3 columns (index+title / tagline+submitter / reward+CTA).
 * Mobile: flow grid so long titles push description down instead of overlapping.
 *
 * Title and Discuss CTA both link to the idea detail page.
 */
export function IdeaRow({ index, idea }: Props) {
  const indexLabel = index.toString().padStart(2, '0')
  const isOdd = index % 2 === 1
  const bg = isOdd ? 'bg-gray-01' : 'bg-brand-dark-green/5'
  const description = idea.tagline ?? idea.summary
  const submitter = `Idea by @${idea.submitter.handle}`
  const mobileDescription = `${description} / ${submitter}`
  const detailHref = `${ROUTES.ideas}/${idea.slug}`
  const ctaLabel = idea.ctaLabel ?? 'Discuss'
  const rewardLines = formatRewardLines(idea.reward)

  return (
    <li className={`${bg} relative w-full`}>
      <div className="group transition-colors hover:bg-brand-dark-green/10">
        {/* Mobile / tablet (below 1025px): 2-column flow grid */}
        <div className="grid min-h-[116px] grid-cols-[1fr_auto] items-start gap-x-3 gap-y-3 p-3 lg:hidden">
          <Link
            href={detailHref}
            className="cursor-pointer font-sans text-[14px] leading-[1.2] text-brand-dark-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
          >
            <span className="font-medium">{indexLabel}</span>
            <span className="ml-3 font-display">{idea.title}</span>
          </Link>
          <Link
            href={detailHref}
            className="inline-flex cursor-pointer items-center justify-center justify-self-end border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
          >
            <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap">
              {ctaLabel}
            </span>
            <span
              aria-hidden="true"
              className="ml-1 font-mono text-[10px] leading-none"
            >
              →
            </span>
          </Link>
          <p className="min-w-0 font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {mobileDescription}
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

        {/* Desktop (1025px+): single flex row with truncation */}
        <div className="hidden h-[50px] items-start gap-3 px-3 pt-3 lg:flex">
          <div className="flex w-1/2 min-w-0 items-baseline gap-3">
            <span className="w-[18px] shrink-0 font-sans text-[14px] font-normal leading-[1.2] text-brand-dark-green">
              {indexLabel}
            </span>
            <Link
              href={detailHref}
              className="min-w-0 cursor-pointer truncate font-display text-[14px] leading-[1.2] text-brand-dark-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
            >
              {idea.title}
            </Link>
          </div>
          <p className="min-w-0 flex-1 font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            <span className="block truncate">{description}</span>
            <span className="block truncate">{submitter}</span>
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
            <Link
              href={detailHref}
              className="inline-flex cursor-pointer items-center justify-center text-brand-dark-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
            >
              <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-0.5">
                {ctaLabel}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </li>
  )
}
