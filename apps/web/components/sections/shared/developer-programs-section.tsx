import type { ReactNode } from 'react'
import Image from 'next/image'
import type { BuilderHubHomeRfpResolution } from '@repo/content/loaders'
import type { BuilderHubSettings, MediaRef } from '@repo/content/schemas'
import ContentWidth from '@/components/layout/content-width'
import { LambdaLockup } from '@/components/ui/lambda-lockup'
import { Link } from '@/i18n/navigation'

interface DeveloperProgramsSectionProps {
  id: string
  index: string
  title: string
  data: NonNullable<BuilderHubSettings['programs']>
  rfps: BuilderHubHomeRfpResolution['rfps']
  eventNames?: {
    prize: string
    rfps: string
  }
}

export function DeveloperProgramsSection({
  id,
  index,
  title,
  data,
  rfps,
  eventNames,
}: DeveloperProgramsSectionProps) {
  const previewRfps = rfps.filter((rfp) => !rfp.featured).slice(0, 4)

  return (
    <ProgramPanelsSection
      id={id}
      header={
        <h2 className="flex items-baseline gap-3 text-[24px] leading-[1.1] tracking-[-0.24px] whitespace-nowrap">
          <span className="font-display text-brand-dark-green/50">{index}</span>
          <span className="font-sans text-brand-dark-green">{title}</span>
        </h2>
      }
    >
      <ProgramImagePanel
        link={{
          href: data.prizeHref,
          ariaLabel: `${data.prizeTitle}: ${data.prizeHeading}`,
          eventName: eventNames?.prize,
        }}
        image={data.prizeImage}
        mark={
          <LambdaLockup className="relative [--lockup-font-size:24px]">
            <span className="text-h4-serif">{data.prizeTitle}</span>
          </LambdaLockup>
        }
        title={data.prizeHeading}
        description={data.prizeDescription}
      />

      <ProgramOutlinePanel
        link={{
          href: data.rfpsHref,
          ariaLabel: data.rfpsTitle,
          eventName: eventNames?.rfps,
        }}
        title={data.rfpsTitle}
        description={data.rfpsDescription}
      >
        <div className="mt-15 flex w-full justify-center gap-3 md:w-[1416px] md:-translate-x-[176px] md:justify-start">
          {previewRfps.map((rfp, itemIndex) => (
            <div
              key={rfp.slug}
              className={`relative hidden h-[166px] w-full max-w-[345px] shrink-0 overflow-hidden rounded-xl border border-brand-dark-green/50 p-4 first:block md:block md:w-[345px] ${
                itemIndex % 2 === 1 ? 'opacity-50' : ''
              }`}
            >
              <h4 className="w-[249px] text-h4-sans">{rfp.title}</h4>
              <span className="absolute top-[83px] left-4 font-mono text-xs font-semibold uppercase underline underline-offset-[3px]">
                {rfp.ctaLabel ?? data.rfpsTitle}
              </span>
              <p className="absolute bottom-4 left-4 w-[186px] text-mono-s">
                {rfp.tagline ?? rfp.summary}
              </p>
              {rfp.image ? (
                <Image
                  src={rfp.image.src}
                  alt={rfp.image.alt}
                  width={96}
                  height={120}
                  className="absolute right-[10px] bottom-[11px] h-[120px] w-[96px] object-cover max-[400px]:hidden"
                />
              ) : null}
            </div>
          ))}
        </div>
      </ProgramOutlinePanel>
    </ProgramPanelsSection>
  )
}

interface ProgramPanelsSectionProps {
  id?: string
  header?: ReactNode
  children: ReactNode
  /** Replaces the section's border and spacing. */
  className?: string
}

/** The two-panel strip. Exported so campaign pages can fill it themselves. */
export function ProgramPanelsSection({
  id,
  header,
  children,
  className = 'border-t border-brand-dark-green/10 pt-6 pb-25',
}: ProgramPanelsSectionProps) {
  return (
    <section id={id} className={className}>
      <ContentWidth>
        {header}
        <div className={`grid gap-3 md:grid-cols-2 ${header ? 'mt-10' : ''}`}>
          {children}
        </div>
      </ContentWidth>
    </section>
  )
}

interface ProgramPanelLink {
  href: string
  ariaLabel: string
  eventName?: string
}

const PANEL_FOCUS_CLASSNAME =
  'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green'

function ProgramPanel({
  link,
  className,
  children,
}: {
  link?: ProgramPanelLink
  className: string
  children: ReactNode
}) {
  if (!link) {
    return <div className={className}>{children}</div>
  }

  // External URLs open in a new tab and skip the locale prefix, as the app
  // Button does.
  if (/^https?:\/\//.test(link.href)) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.ariaLabel}
        data-umami-event-name={link.eventName}
        className={`${className} ${PANEL_FOCUS_CLASSNAME}`}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={link.href}
      aria-label={link.ariaLabel}
      data-umami-event-name={link.eventName}
      className={`${className} ${PANEL_FOCUS_CLASSNAME}`}
    >
      {children}
    </Link>
  )
}

interface ProgramImagePanelProps {
  link?: ProgramPanelLink
  image: MediaRef
  /** Brand mark above the title. */
  mark: ReactNode
  title: string
  description: string
}

export function ProgramImagePanel({
  link,
  image,
  mark,
  title,
  description,
}: ProgramImagePanelProps) {
  return (
    <ProgramPanel
      link={link}
      className="relative flex h-[370px] flex-col items-center justify-center gap-10 overflow-hidden rounded-xl px-4 py-10 text-center text-brand-off-white"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      {mark}
      <div className="relative flex flex-col items-center gap-3">
        <h3 className="text-subhead-sans">{title}</h3>
        <p className="w-full max-w-[338px] text-mono-s">{description}</p>
      </div>
    </ProgramPanel>
  )
}

interface ProgramOutlinePanelProps {
  link?: ProgramPanelLink
  /** Shown above the title, e.g. a partner logo. */
  mark?: ReactNode
  title: string
  description: string
  /** Shown below the copy. */
  children?: ReactNode
}

export function ProgramOutlinePanel({
  link,
  mark,
  title,
  description,
  children,
}: ProgramOutlinePanelProps) {
  return (
    <ProgramPanel
      link={link}
      className="flex h-[370px] flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green px-4 py-10"
    >
      {mark ? <div className="mb-10">{mark}</div> : null}
      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-subhead-sans">{title}</h3>
        <p className="w-full max-w-[338px] text-mono-s">{description}</p>
      </div>
      {children}
    </ProgramPanel>
  )
}
