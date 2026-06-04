/**
 * @figma-node   40009046:22948 / 40009046:21794 (desktop 1440 × 708)
 *               40009046:22697 (mobile 394 × 847)
 *
 * Site footer. Dark-green bg, off-white text.
 *
 * Desktop uses absolute positions from Figma's footer component so page-height
 * audits can compare the shared footer directly against the frame. Mobile (base,
 * below 1025px) compacts those offsets to ~612px so the whole footer — newsletter
 * title through legal links — fits within a single phone viewport without scrolling.
 */
import type { ReactNode } from 'react'

import type { LinkLikeComponent } from '../button/button'
import { FooterArrowIcon, FooterChevronIcon } from './footer-icons'

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
  /**
   * Interactive newsletter form rendered under the title. Supply the client
   * `FooterNewsletter` here. When omitted, a static (non-interactive)
   * fallback built from `newsletter` labels is rendered instead.
   */
  newsletterForm?: ReactNode
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

function FooterLinkItem({
  label,
  href,
  external,
  linkAs: LinkAs = 'a',
}: FooterLink & { linkAs?: LinkLikeComponent }) {
  const external_ = external || href.startsWith('http')
  const className =
    'text-mono-s w-fit cursor-pointer border-b border-brand-off-white/10 text-brand-off-white transition-opacity hover:opacity-70'
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
  newsletterForm,
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
      className={`relative h-[612px] overflow-hidden bg-brand-dark-green text-brand-off-white lg:h-[688px] ${className ?? ''}`}
    >
      <div className="absolute top-6 left-3 flex w-[370px] max-w-[calc(100%-24px)] flex-col gap-3 lg:w-[345px]">
        <p className="w-[314px] font-sans text-[18px] leading-[1.15] tracking-[-0.18px] text-brand-off-white">
          {newsletter.title}
        </p>
        {newsletterForm ?? (
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
        )}
      </div>

      <div className="absolute top-[200px] left-3 h-[47px] w-[83px] overflow-hidden lg:top-[549px] lg:h-[127px] lg:w-[226px] *:size-full *:object-cover">
        {image}
      </div>

      <div className="absolute top-[200px] left-[calc(50%+6px)] lg:top-6">
        {logo}
      </div>

      {tagline && (
        <p className="text-body-serif absolute top-[251px] left-[calc(50%+6px)] w-[175px] text-brand-off-white lg:top-[22px] lg:left-[calc(83.33%+2px)] lg:w-[226px]">
          {tagline}
        </p>
      )}

      <div className="absolute top-[332px] left-3 lg:top-[133px] lg:left-[calc(50%+6px)]">
        <LinkList links={mainLinks} />
      </div>

      <div className="absolute top-[332px] left-[calc(50%+6px)] lg:top-[133px] lg:left-[calc(83.33%+3px)]">
        <LinkList links={socialLinks} />
      </div>

      <div className="absolute top-[460px] left-3 lg:top-[322px] lg:left-[calc(50%+8px)]">
        <LinkList label="Research" links={researchLinks} />
      </div>

      <div className="absolute top-[460px] left-[calc(50%+6px)] lg:top-[322px] lg:left-[calc(83.33%+3px)]">
        <LinkList label="Infrastructure" links={infrastructureLinks} />
      </div>

      <div className="absolute top-[540px] left-3 lg:top-[617px] lg:left-[calc(50%+6px)]">
        <LinkList links={legalLinks} />
      </div>
    </footer>
  )
}
