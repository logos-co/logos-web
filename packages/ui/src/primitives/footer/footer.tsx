/**
 * @figma-node   40009046:22948 / 40009046:21794 (desktop 1440 × 708)
 *               40009046:22697 (mobile 394 × 847)
 *
 * Site footer. Dark-green bg, off-white text.
 *
 * Desktop and mobile use absolute positions from Figma's footer component so
 * page-height audits can compare the shared footer directly against the frame.
 */
import type { ReactNode } from 'react'

import type { LinkLikeComponent } from '../button/button'

export type FooterLink = {
  label: string
  href: string
  external?: boolean
}

export type FooterProps = {
  image?: ReactNode
  newsletter: {
    title: string
    emailLabel: string
    roleLabel: string
    cityLabel: string
    submitLabel: string
  }
  tagline?: ReactNode
  logo?: ReactNode
  mainLinks: FooterLink[]
  socialLinks: FooterLink[]
  researchLinks: FooterLink[]
  infrastructureLinks: FooterLink[]
  legalLinks: FooterLink[]
  builtBy?: { label: string; attribution: ReactNode; href?: string }
  /** Override the internal-link element (e.g. pass next-intl's `Link`). External links always use `<a>`. Defaults to `'a'`. */
  linkAs?: LinkLikeComponent
  className?: string
}

function FooterChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[15px] shrink-0"
      fill="none"
      viewBox="0 0 15 15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.5 6L7.5 9L10.5 6" stroke="currentColor" />
    </svg>
  )
}

function FooterArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[15px] shrink-0"
      fill="none"
      viewBox="0 0 15 15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 7.5H11.5M11.5 7.5L8 4M11.5 7.5L8 11"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

function FooterLinkItem({
  label,
  href,
  external,
  linkAs: LinkAs = 'a',
}: FooterLink & { linkAs?: LinkLikeComponent }) {
  const external_ = external || href.startsWith('http')
  const className =
    'text-mono-s cursor-pointer border-b border-brand-off-white/10 text-brand-off-white transition-opacity hover:opacity-70'
  if (external_) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    )
  }
  return (
    <LinkAs href={href} className={className}>
      {label}
    </LinkAs>
  )
}

function LinkList({
  label,
  links,
  linkAs,
}: {
  label?: string
  links: FooterLink[]
  linkAs?: LinkLikeComponent
}) {
  if (links.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <p className="text-eyebrow mb-1 text-brand-off-white">{label}</p>
      )}
      {links.map((link) => (
        <FooterLinkItem key={link.href} {...link} linkAs={linkAs} />
      ))}
    </div>
  )
}

export function Footer({
  image,
  newsletter,
  tagline,
  mainLinks,
  socialLinks,
  researchLinks,
  infrastructureLinks,
  legalLinks,
  logo,
  className,
}: FooterProps) {
  return (
    <footer
      className={`relative h-[847px] overflow-hidden bg-brand-dark-green text-brand-off-white min-[1025px]:h-[688px] ${className ?? ''}`}
    >
      <div className="absolute top-6 left-3 flex w-[370px] max-w-[calc(100%-24px)] flex-col gap-3 min-[1025px]:w-[345px]">
        <p className="w-[314px] font-sans text-[18px] leading-[1.15] tracking-[-0.18px] text-brand-off-white">
          {newsletter.title}
        </p>
        <div className="flex w-full flex-col gap-1">
          <button className="text-eyebrow flex h-[32px] w-full cursor-pointer items-center justify-center border border-brand-off-white/50 px-3 py-2 text-brand-off-white uppercase backdrop-blur-[5px]">
            {newsletter.emailLabel}
          </button>
          <div className="flex w-full items-center gap-1">
            <button className="text-eyebrow flex h-[32px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 border border-brand-off-white/50 px-3 py-2 text-brand-off-white uppercase backdrop-blur-[5px]">
              {newsletter.roleLabel}
              <FooterChevronIcon />
            </button>
            <button className="text-eyebrow flex h-[32px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 border border-brand-off-white/50 px-3 py-2 text-brand-off-white uppercase backdrop-blur-[5px]">
              {newsletter.cityLabel}
              <FooterChevronIcon />
            </button>
            <button className="text-eyebrow flex h-[32px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green uppercase backdrop-blur-[5px]">
              {newsletter.submitLabel}
              <FooterArrowIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-[244px] left-3 h-[47px] w-[83px] overflow-hidden min-[1025px]:top-[549px] min-[1025px]:h-[127px] min-[1025px]:w-[226px] *:size-full *:object-cover">
        {image}
      </div>

      <div className="absolute top-[244px] left-[calc(50%+6px)] min-[1025px]:top-6">
        {logo}
      </div>

      {tagline && (
        <p className="text-body-serif absolute top-[295px] left-[calc(50%+6px)] w-[175px] text-brand-off-white min-[1025px]:top-[22px] min-[1025px]:left-[calc(83.33%+2px)] min-[1025px]:w-[226px]">
          {tagline}
        </p>
      )}

      <div className="absolute top-[433px] left-3 min-[1025px]:top-[133px] min-[1025px]:left-[calc(50%+6px)]">
        <LinkList links={mainLinks} />
      </div>

      <div className="absolute top-[433px] left-[calc(50%+6px)] min-[1025px]:top-[133px] min-[1025px]:left-[calc(83.33%+3px)]">
        <LinkList links={socialLinks} />
      </div>

      <div className="absolute top-[608px] left-3 min-[1025px]:top-[322px] min-[1025px]:left-[calc(50%+8px)]">
        <LinkList label="Research" links={researchLinks} />
      </div>

      <div className="absolute top-[608px] left-[calc(50%+6px)] min-[1025px]:top-[322px] min-[1025px]:left-[calc(83.33%+3px)]">
        <LinkList label="Infrastructure" links={infrastructureLinks} />
      </div>

      <div className="absolute top-[788px] left-3 min-[1025px]:top-[617px] min-[1025px]:left-[calc(50%+6px)]">
        <LinkList links={legalLinks} />
      </div>
    </footer>
  )
}
