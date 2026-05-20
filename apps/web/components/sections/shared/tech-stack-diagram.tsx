import Image from 'next/image'
import type { ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'
import type { TechStackOverviewSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'

import { DownloadIcon } from './builder-cta-card'

const hoverThumbnail = '/images/technology-stack/logos-basecamp.jpg'

function formatNetworkingTitle(title: string) {
  return title.replace(': ', ':\n')
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
}) {
  const hasDetails = details !== undefined && details.length > 0

  return (
    <div
      className={`group/stack-item relative flex items-center justify-center overflow-hidden rounded-3xl border border-brand-dark-green px-6 text-center text-brand-dark-green transition-[border-color] duration-300 ease-out hover:border-transparent ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-3xl bg-accent-light-blue opacity-0 scale-[0.985] transition-all duration-300 ease-out group-hover/stack-item:opacity-100 group-hover/stack-item:scale-100" />

      <span className="pointer-events-none absolute top-3 left-3 z-[1] hidden h-[57px] w-[46px] overflow-hidden opacity-0 translate-y-1 transition-all duration-300 ease-out group-hover/stack-item:opacity-100 group-hover/stack-item:translate-y-0 md:block">
        <Image
          src={hoverThumbnail}
          alt=""
          fill
          sizes="46px"
          className="object-cover"
        />
      </span>

      <Button
        href={href}
        icon={ctaIcon ?? <ButtonArrowIcon />}
        className={`absolute top-2.5 right-2.5 z-10 cursor-pointer transition-all duration-300 ease-out md:top-3 md:right-3 ${
          ctaVisibleByDefault
            ? ''
            : 'pointer-events-none opacity-0 translate-y-1 group-hover/stack-item:pointer-events-auto group-hover/stack-item:opacity-100 group-hover/stack-item:translate-y-0 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:translate-y-0'
        }`}
      >
        {ctaLabel}
      </Button>

      <div
        className={`relative z-[1] flex max-w-[222px] flex-col items-center gap-3 transition-transform duration-300 ease-out ${
          hasDetails ? 'md:group-hover/stack-item:-translate-y-[72px]' : ''
        }`}
      >
        <span
          className={`text-subhead-sans flex items-center gap-2.5 ${labelClassName ?? ''}`}
        >
          <LogosMark size={14} className="shrink-0 text-gray-03" />
          {title}
        </span>
        {description ? (
          <p className="text-mono-s hidden text-center opacity-0 translate-y-1 transition-all duration-300 ease-out group-hover/stack-item:opacity-100 group-hover/stack-item:translate-y-0 md:block">
            {description}
          </p>
        ) : null}
      </div>

      {hasDetails ? (
        <div className="absolute right-3 bottom-3 left-3 z-[1] hidden flex-col gap-3 opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover/stack-item:flex group-hover/stack-item:opacity-100 group-hover/stack-item:translate-y-0 md:flex">
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
      ) : null}
    </div>
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
        <Reveal amount={0.2}>
          <HoverStackItem
            title={data.basecamp.title}
            description={data.basecamp.body}
            href={data.basecamp.cta?.href ?? data.basecamp.href}
            ctaLabel={data.basecamp.cta?.label ?? 'Install'}
            ctaIcon={<DownloadIcon />}
            ctaVisibleByDefault
            className="h-[105px] w-full border-brand-dark-green md:h-[196px]"
          />
        </Reveal>
      ) : null}

      <Reveal
        stagger
        amount={0.15}
        className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4"
      >
        {data.pillars.map((pillar) => (
          <RevealItem key={pillar.id}>
            <HoverStackItem
              title={pillar.title}
              description={pillar.body}
              href={pillar.href}
              className="h-[140px] w-full md:h-[366px]"
              details={pillar.details}
            />
          </RevealItem>
        ))}
      </Reveal>

      <Reveal stagger amount={0.2} className="mt-3 space-y-3">
        <RevealItem>
          <HoverStackItem
            title={formatNetworkingTitle(data.networkingTitle)}
            description={data.networkingDescription}
            href={networkingHref}
            className="h-[105px] w-full md:h-[196px]"
            labelClassName="whitespace-pre-line"
          />
        </RevealItem>
        <RevealItem>
          <HoverStackItem
            title={data.foundationTitle}
            description={data.foundationDescription}
            href={foundationHref}
            className="h-[105px] w-full md:h-[196px]"
          />
        </RevealItem>
      </Reveal>
    </div>
  )
}
