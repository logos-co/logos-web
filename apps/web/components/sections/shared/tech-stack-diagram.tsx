import Image from 'next/image'
import type { ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'
import type { TechStackOverviewSection } from '@repo/content/schemas'

import { ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import { DownloadIcon } from './builder-cta-card'

const STACK_THUMBNAILS: Record<string, string> = {
  basecamp: '/images/technology-stack/thumb-networking.webp',
  storage: '/images/technology-stack/thumb-storage.webp',
  messaging: '/images/technology-stack/thumb-messaging.webp',
  blockchain: '/images/technology-stack/thumb-blockchain.webp',
  userModules: '/images/technology-stack/thumb-user-modules.webp',
  networking: '/images/technology-stack/thumb-networking.webp',
  foundation: '/images/technology-stack/thumb-foundation.webp',
}

function formatNetworkingTitle(title: string) {
  return title.replace(': ', ':\n')
}

function StackItemCta({
  children,
  icon,
  className,
}: {
  children: string
  icon?: ReactNode
  className: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-xl bg-brand-dark-green px-3 py-2 text-brand-off-white backdrop-blur-[5px] ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
          {children}
        </span>
        {icon}
      </span>
    </span>
  )
}

function HoverStackItem({
  title,
  description,
  href,
  target,
  rel,
  ctaLabel = 'Learn More',
  className,
  labelClassName,
  ctaIcon,
  ctaVisibleByDefault = false,
  details,
  mobileFeatured = false,
  desktopAt1025 = false,
  comingSoon = false,
  hideCta = false,
  thumbnailSrc,
}: {
  title: string
  description?: string
  href: string
  target?: '_blank'
  rel?: 'noopener noreferrer'
  ctaLabel?: string
  className: string
  labelClassName?: string
  ctaIcon?: ReactNode
  ctaVisibleByDefault?: boolean
  details?: ReadonlyArray<{
    title: string
    body: string
  }>
  mobileFeatured?: boolean
  desktopAt1025?: boolean
  /**
   * When true the item is rendered as a non-interactive card (no link) and its
   * CTA shows "Soon" instead of "Learn More". Used for pillars whose
   * destination is not yet available.
   */
  comingSoon?: boolean
  /**
   * When true the item is rendered as a non-interactive card (no link) with no
   * CTA button at all. Used for pillars that have no destination to link to.
   */
  hideCta?: boolean
  thumbnailSrc: string
}) {
  const hasDetails = details !== undefined && details.length > 0
  const desktopHoverLarge = desktopAt1025
    ? 'lg:group-hover/stack-item:-translate-y-24'
    : 'md:group-hover/stack-item:-translate-y-24'
  const desktopHoverSmall = desktopAt1025
    ? 'lg:group-hover/stack-item:-translate-y-8'
    : 'md:group-hover/stack-item:-translate-y-8'
  const desktopBlock = desktopAt1025 ? 'lg:block' : 'md:block'
  const desktopHidden = desktopAt1025 ? 'lg:hidden' : 'md:hidden'
  const desktopFlex = desktopAt1025 ? 'lg:flex' : 'md:flex'
  const desktopCtaPosition = desktopAt1025
    ? 'lg:top-3 lg:right-3'
    : 'md:top-3 md:right-3'
  const contentHoverOffset =
    details !== undefined && details.length > 1
      ? desktopHoverLarge
      : hasDetails
        ? desktopHoverSmall
        : ''
  const stackItemLayoutClass = mobileFeatured
    ? desktopAt1025
      ? 'items-start justify-start p-3 lg:items-center lg:justify-center lg:px-6 lg:py-0'
      : 'items-start justify-start p-3 md:items-center md:justify-center md:px-6 md:py-0'
    : hasDetails
      ? desktopAt1025
        ? 'items-end justify-between p-1.5 lg:items-center lg:justify-center lg:px-6 lg:py-0'
        : 'items-end justify-between p-1.5 md:items-center md:justify-center md:px-6 md:py-0'
      : desktopAt1025
        ? 'items-center justify-center px-3 lg:px-6'
        : 'items-center justify-center px-3 md:px-6'
  const contentLayoutClass = mobileFeatured
    ? desktopAt1025
      ? 'items-start text-left lg:items-center lg:text-center'
      : 'items-start text-left md:items-center md:text-center'
    : hasDetails
      ? desktopAt1025
        ? 'h-[134px] w-full items-center justify-center px-3 py-8.5 text-center lg:h-auto lg:w-auto lg:px-0 lg:py-0'
        : 'h-[134px] w-full items-center justify-center px-3 py-8.5 text-center md:h-auto md:w-auto md:px-0 md:py-0'
      : 'items-center'
  const mobileDescriptionClass = mobileFeatured
    ? 'text-left'
    : hasDetails
      ? 'w-full text-center'
      : 'text-center'

  const containerClassName = `group/stack-item relative flex flex-col ${
    comingSoon || hideCta ? '' : 'cursor-pointer '
  }overflow-hidden rounded-3xl border border-brand-dark-green text-center text-brand-dark-green transition-[border-color] duration-200 ease-out hover:border-brand-dark-green/30 focus-visible:border-brand-dark-green/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green ${stackItemLayoutClass} ${className}`

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 rounded-3xl bg-accent-light-blue opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:opacity-100" />

      <span
        className={`pointer-events-none absolute top-3 left-3 z-[1] hidden h-[57px] w-[46px] overflow-hidden opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:opacity-100 ${desktopBlock}`}
      >
        <Image
          src={thumbnailSrc}
          alt=""
          fill
          sizes="46px"
          className="object-cover"
        />
      </span>

      {hideCta ? null : (
        <StackItemCta
          icon={comingSoon ? undefined : (ctaIcon ?? <ButtonArrowIcon />)}
          className={`absolute top-2.5 right-2.5 z-10 transition-opacity duration-200 ease-out ${
            comingSoon ? '' : 'cursor-pointer '
          }${desktopCtaPosition} ${
            ctaVisibleByDefault
              ? ''
              : 'pointer-events-none opacity-0 group-hover/stack-item:opacity-100 group-focus-visible/stack-item:opacity-100'
          }`}
        >
          {comingSoon ? 'Soon' : ctaLabel}
        </StackItemCta>
      )}

      <div
        className={`relative z-[1] flex max-w-[222px] flex-col gap-3 transition-transform duration-200 ease-out ${contentLayoutClass} ${contentHoverOffset}`}
      >
        <span
          className={`text-subhead-sans flex items-center gap-2.5 ${labelClassName ?? ''}`}
        >
          <span className={`hidden shrink-0 ${desktopBlock}`}>
            <LogosMark size={14} className="text-gray-03" />
          </span>
          {title}
        </span>
        {description ? (
          <>
            <p
              className={`text-mono-s ${desktopHidden} ${mobileDescriptionClass}`}
            >
              {description}
            </p>
            <p
              className={`text-mono-s hidden text-center opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:opacity-100 ${desktopBlock}`}
            >
              {description}
            </p>
          </>
        ) : null}
      </div>

      {hasDetails ? (
        <>
          <div
            className={`relative z-[1] flex w-full shrink-0 flex-col gap-1.5 ${desktopHidden}`}
          >
            {details.map((detail) => (
              <div
                key={detail.title}
                className="flex h-[50px] items-center justify-center rounded-[18px] border border-brand-dark-green/50 px-2 text-brand-dark-green"
              >
                <p className="text-center font-mono text-[10px] leading-[1.3] font-medium uppercase">
                  {detail.title}
                </p>
              </div>
            ))}
          </div>
          <div
            className={`absolute right-3 bottom-3 left-3 z-[1] hidden flex-col gap-3 opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:flex group-hover/stack-item:opacity-100 ${desktopFlex}`}
          >
            {details.map((detail) => (
              <div
                key={detail.title}
                className="rounded-[18px] border border-brand-dark-green/50 px-4 py-3 text-left text-brand-dark-green"
              >
                <p className="font-mono text-[10px] leading-[1.25] font-semibold tracking-[0.08em] uppercase">
                  {detail.title}
                </p>
                <p className="mt-1.5 font-mono text-[10px] leading-[1.25]">
                  {detail.body}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  )

  if (comingSoon || hideCta) {
    return <div className={containerClassName}>{content}</div>
  }

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={containerClassName}
    >
      {content}
    </Link>
  )
}

export function TechStackDiagram({
  data,
  networkingHref,
  foundationHref,
  className,
  desktopAt1025 = false,
}: {
  data: TechStackOverviewSection
  networkingHref: string
  foundationHref: string
  className?: string
  desktopAt1025?: boolean
}) {
  const basecampClass = desktopAt1025
    ? 'h-[111px] w-full border-brand-dark-green lg:h-[196px]'
    : 'h-[111px] w-full border-brand-dark-green md:h-[196px]'

  const pillarsGridClass = desktopAt1025
    ? 'mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4'
    : 'mt-3 grid grid-cols-2 gap-3 md:grid-cols-4'

  const pillarClass = desktopAt1025
    ? 'h-[258px] w-full lg:h-[366px]'
    : 'h-[258px] w-full md:h-[366px]'

  const rowClass = desktopAt1025
    ? 'h-[196px] w-full lg:h-[196px]'
    : 'h-[196px] w-full md:h-[196px]'

  return (
    <div className={className}>
      {data.basecamp ? (
        <HoverStackItem
          title={data.basecamp.title}
          description={data.basecamp.body}
          href={data.basecamp.cta?.href ?? data.basecamp.href}
          ctaLabel={data.basecamp.cta?.label ?? 'Install'}
          ctaIcon={<DownloadIcon />}
          ctaVisibleByDefault
          mobileFeatured
          desktopAt1025={desktopAt1025}
          className={basecampClass}
          thumbnailSrc={STACK_THUMBNAILS.basecamp}
        />
      ) : null}

      <div className={pillarsGridClass}>
        {data.pillars.map((pillar) => (
          <HoverStackItem
            key={pillar.id}
            title={pillar.title}
            description={pillar.body}
            href={pillar.href}
            className={pillarClass}
            details={pillar.details}
            desktopAt1025={desktopAt1025}
            hideCta={pillar.id === 'userModules'}
            thumbnailSrc={STACK_THUMBNAILS[pillar.id]}
          />
        ))}
      </div>

      <div className="mt-3 space-y-3">
        <HoverStackItem
          title={formatNetworkingTitle(data.networkingTitle)}
          description={data.networkingDescription}
          href={networkingHref}
          className={rowClass}
          labelClassName="whitespace-pre-line"
          desktopAt1025={desktopAt1025}
          thumbnailSrc={STACK_THUMBNAILS.networking}
        />
        <HoverStackItem
          title={data.foundationTitle}
          description={data.foundationDescription}
          href={foundationHref}
          className={rowClass}
          desktopAt1025={desktopAt1025}
          hideCta
          thumbnailSrc={STACK_THUMBNAILS.foundation}
        />
      </div>
    </div>
  )
}
