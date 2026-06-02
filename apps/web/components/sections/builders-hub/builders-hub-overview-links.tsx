import type { BuilderHubSettings } from '@repo/content/schemas'

import { Link } from '@/i18n/navigation'

type OverviewLink = BuilderHubSettings['overviewLinks'][number]

type Props = {
  links: OverviewLink[]
}

/**
 * 5-row "tech stack" table that links out to the major Builders Hub
 * destinations (Ideas, RFPs, Resources, GitHub Issues, Contribute).
 *
 * Desktop (Figma 40009046:23954): rows 70 px high, 3 columns —
 *   index+title (714 px) / description (464 px) / two CTAs (150 px).
 *
 * Mobile (Figma 40009046:23770): rows 104 px high, stacked —
 *   row 1 = "0X Title" + 2 CTAs aligned right; row 2 = description.
 *
 * Background alternates row-by-row: odd rows `gray-01`, even rows
 * `brand-dark-green/5`.
 */
export function BuildersHubOverviewLinks({ links }: Props) {
  return (
    <ul className="w-full">
      {links.map((link, index) => (
        <OverviewRow key={link.key} index={index + 1} link={link} />
      ))}
    </ul>
  )
}

function OverviewRow({ index, link }: { index: number; link: OverviewLink }) {
  const indexLabel = index.toString().padStart(2, '0')
  // Odd-indexed rows (visually 1st, 3rd, 5th) get the gray-01 background.
  const isOdd = index % 2 === 1
  const bg = isOdd ? 'bg-gray-01' : 'bg-brand-dark-green/5'
  const isExternal = /^https?:\/\//.test(link.primaryCta.href)

  return (
    <li className={`${bg} relative w-full`}>
      <Link
        href={link.primaryCta.href}
        className="group block transition-colors hover:bg-brand-dark-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {/* Mobile: stacked layout */}
        <div className="flex flex-col gap-3 py-3 px-3 md:hidden">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-[14px] leading-[1.2] text-brand-dark-green">
              <span className="font-medium">{indexLabel}</span>
              <span className="ml-3 font-display">{link.title}</span>
            </span>
            <span className="flex items-baseline gap-3 shrink-0">
              <OverviewCtaLabel>{link.primaryCta.label}</OverviewCtaLabel>
              {link.secondaryCta ? (
                <OverviewCtaLabel>{link.secondaryCta.label}</OverviewCtaLabel>
              ) : null}
            </span>
          </div>
          <p className="font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {link.description}
          </p>
        </div>

        {/* Desktop: 3-column row, 70 px tall */}
        <div className="relative hidden h-[70px] md:block">
          {/* Index + Title — left column (cols 1–7) */}
          <div className="absolute top-3 left-3 flex items-baseline gap-3">
            <span className="font-sans text-[14px] font-medium leading-[1.2] text-brand-dark-green w-[18px]">
              {indexLabel}
            </span>
            <span className="font-display text-[14px] leading-[1.2] text-brand-dark-green whitespace-nowrap">
              {link.title}
            </span>
          </div>

          {/* Description — middle column (start col 7) */}
          <p className="absolute top-3 left-[50%] translate-x-[6px] w-[345px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {link.description}
          </p>

          {/* CTAs — right column (start col 11) */}
          <div className="absolute top-3 left-[83.33%] translate-x-[2px] flex items-baseline gap-3">
            <OverviewCtaLabel>{link.primaryCta.label}</OverviewCtaLabel>
            {link.secondaryCta ? (
              <OverviewCtaLabel>{link.secondaryCta.label}</OverviewCtaLabel>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  )
}

function OverviewCtaLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center justify-center text-brand-dark-green">
      <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-0.5">
        {children}
      </span>
    </span>
  )
}
