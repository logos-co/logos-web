import Image from 'next/image'
import type { ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'
import type { TechStackOverviewSection } from '@repo/content/schemas'

import { ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import { DownloadIcon } from './builder-cta-card'

const hoverThumbnail = '/images/technology-stack/logos-basecamp.jpg'

function formatNetworkingTitle(title: string) {
  return title.replace(': ', ':\n')
}

function StackItemCta({
  children,
  icon,
  className,
}: {
  children: string
  icon: ReactNode
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
  ctaLabel = 'Learn More',
  className,
  labelClassName,
  ctaIcon,
  ctaVisibleByDefault = false,
  details,
  mobileFeatured = false,
}: {
  title: string
  description?: string
  href: string
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
}) {
  const hasDetails = details !== undefined && details.length > 0
  const contentHoverOffset =
    details !== undefined && details.length > 1
      ? 'md:group-hover/stack-item:-translate-y-24'
      : hasDetails
        ? 'md:group-hover/stack-item:-translate-y-8'
        : ''

  return (
    <Link
      href={href}
      className={`group/stack-item relative flex cursor-pointer overflow-hidden rounded-3xl border border-brand-dark-green px-6 text-center text-brand-dark-green transition-[border-color] duration-200 ease-out hover:border-brand-dark-green/30 focus-visible:border-brand-dark-green/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green ${
        mobileFeatured
          ? 'items-start justify-start md:items-center md:justify-center'
          : 'items-center justify-center'
      } ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-3xl bg-accent-light-blue opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:opacity-100" />

      <span className="pointer-events-none absolute top-3 left-3 z-[1] hidden h-[57px] w-[46px] overflow-hidden opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:opacity-100 md:block">
        <Image
          src={hoverThumbnail}
          alt=""
          fill
          sizes="46px"
          className="object-cover"
        />
      </span>

      <StackItemCta
        icon={ctaIcon ?? <ButtonArrowIcon />}
        className={`absolute top-2.5 right-2.5 z-10 cursor-pointer transition-opacity duration-200 ease-out md:top-3 md:right-3 ${
          ctaVisibleByDefault
            ? ''
            : 'pointer-events-none opacity-0 group-hover/stack-item:opacity-100 group-focus-visible/stack-item:opacity-100'
        }`}
      >
        {ctaLabel}
      </StackItemCta>

      <div
        className={`relative z-[1] flex max-w-[222px] flex-col gap-3 transition-transform duration-200 ease-out ${
          mobileFeatured
            ? 'items-start text-left md:items-center md:text-center'
            : 'items-center'
        } ${contentHoverOffset}`}
      >
        <span
          className={`text-subhead-sans flex items-center gap-2.5 ${labelClassName ?? ''}`}
        >
          <span className="hidden shrink-0 md:block">
            <LogosMark size={14} className="text-gray-03" />
          </span>
          {title}
        </span>
        {description ? (
          <>
            <p
              className={`text-mono-s md:hidden ${
                mobileFeatured ? 'text-left' : 'text-center'
              }`}
            >
              {description}
            </p>
            <p className="text-mono-s hidden text-center opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:opacity-100 md:block">
              {description}
            </p>
          </>
        ) : null}
      </div>

      {hasDetails ? (
        <>
          <div className="absolute right-1.5 bottom-1.5 left-1.5 z-[1] flex flex-col gap-1.5 md:hidden">
            {details.map((detail) => (
              <div
                key={detail.title}
                className="flex min-h-[50px] items-center justify-center rounded-[18px] border border-brand-dark-green/50 px-2 text-brand-dark-green"
              >
                <p className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
                  {detail.title}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute right-3 bottom-3 left-3 z-[1] hidden flex-col gap-3 opacity-0 transition-opacity duration-200 ease-out group-hover/stack-item:flex group-hover/stack-item:opacity-100 md:flex">
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
    </Link>
  )
}

export function TechStackDiagram({
  data,
  networkingHref,
  foundationHref,
  className,
}: {
  data: TechStackOverviewSection
  networkingHref: string
  foundationHref: string
  className?: string
}) {
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
          className="h-[111px] w-full border-brand-dark-green p-3 md:h-[196px] md:px-6"
        />
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.pillars.map((pillar) => (
          <HoverStackItem
            key={pillar.id}
            title={pillar.title}
            description={pillar.body}
            href={pillar.href}
            className="h-[258px] w-full px-3 md:h-[366px] md:px-6"
            details={pillar.details}
          />
        ))}
      </div>

      <div className="mt-3 space-y-3">
        <HoverStackItem
          title={formatNetworkingTitle(data.networkingTitle)}
          description={data.networkingDescription}
          href={networkingHref}
          className="h-[196px] w-full md:h-[196px]"
          labelClassName="whitespace-pre-line"
        />
        <HoverStackItem
          title={data.foundationTitle}
          description={data.foundationDescription}
          href={foundationHref}
          className="h-[196px] w-full md:h-[196px]"
        />
      </div>
    </div>
  )
}
