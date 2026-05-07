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
 * mobile 40009046:23857).
 *
 * Desktop: 50 px row, 3 columns (index+title 714 / submitter 464 / reward+CTA 149).
 * Mobile:  116 px row, mixed: title row 1, submitter row 2, reward + CTA stacked
 *          on the right edge.
 */
export function IdeaRow({ index, idea }: Props) {
  const indexLabel = index.toString().padStart(2, '0')
  const isOdd = index % 2 === 1
  const bg = isOdd ? 'bg-gray-01' : 'bg-brand-dark-green/5'
  const description = idea.tagline ?? idea.summary
  const submitter = `Idea by @${idea.submitter.handle}`
  const mobileDescription = `${description} / ${submitter}`
  const detailHref = `${ROUTES.ideas}/${idea.slug}`
  const rewardLines = formatRewardLines(idea.reward)
  const ctaHref = idea.discussionUrl ?? detailHref
  const ctaExternal = Boolean(idea.discussionUrl)

  return (
    <li className={`${bg} relative w-full`}>
      <Link
        href={ctaHref}
        className="group block transition-colors hover:bg-brand-dark-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
        {...(ctaExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {/* Mobile: 116 px stacked layout */}
        <div className="relative h-[116px] md:hidden">
          <p className="absolute top-3 left-3 w-[191px] font-sans text-[14px] leading-[1.2] text-brand-dark-green">
            <span className="font-medium">{indexLabel}</span>
            <span className="ml-3 font-display">{idea.title}</span>
          </p>
          <p className="absolute top-[75px] left-3 w-[179px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {mobileDescription}
          </p>
          <span className="absolute top-3 right-7 inline-flex items-center justify-center rounded-[4px] border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green">
            <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap">
              Apply
            </span>
            <span
              aria-hidden="true"
              className="ml-1 font-mono text-[10px] leading-none"
            >
              →
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

        {/* Desktop: 50 px, 3 columns */}
        <div className="relative hidden h-[50px] md:block">
          {/* Index + Title */}
          <div className="absolute top-3 left-3 flex items-baseline gap-3">
            <span className="font-sans text-[14px] font-medium leading-[1.2] text-brand-dark-green w-[18px]">
              {indexLabel}
            </span>
            <span className="font-display text-[14px] leading-[1.2] text-brand-dark-green whitespace-nowrap">
              {idea.title}
            </span>
          </div>
          {/* Submitter line */}
          <p className="absolute top-3 left-[50%] translate-x-[6px] w-[464px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            <span className="block truncate">{description}</span>
            <span className="block">{submitter}</span>
          </p>
          {/* Reward + CTA */}
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
              <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-[2px]">
                Apply
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}
