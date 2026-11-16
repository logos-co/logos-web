import type { ReactNode } from 'react'
import Image from 'next/image'
import type { ProgrammeCards } from '@/lib/programme-cards'
import { ROUTES } from '@/constants/routes'
import type { BuilderHubSettings, MediaRef } from '@repo/content/schemas'
import ContentWidth from '@/components/layout/content-width'
import { LambdaLockup } from '@/components/ui/lambda-lockup'
import { Link } from '@/i18n/navigation'

interface DeveloperProgramsSectionProps {
  id: string
  index: string
  title: string
  data: NonNullable<BuilderHubSettings['programs']>
  programmeCards: ProgrammeCards
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
  programmeCards,
  eventNames,
}: DeveloperProgramsSectionProps) {
  const { prize, rfps, rfpLinkLabel, noOpenRfps } = programmeCards

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
          ariaLabel: `${data.prizeTitle}: ${prize?.title ?? data.prizeHeading}`,
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
        featured={
          prize && (
            <div className="relative w-full max-w-[338px] rounded-xl border border-brand-off-white/50 px-4 py-3">
              <p className="font-mono text-xs">
                {prize.id} · {prize.amount}
              </p>
              <p className="mt-1 text-mono-s">{prize.title}</p>
            </div>
          )
        }
      />

      <ProgramOutlinePanel
        link={{
          href: data.rfpsHref,
          ariaLabel: data.rfpsTitle,
          eventName: eventNames?.rfps,
        }}
        title={data.rfpsTitle}
        description={data.rfpsDescription}
        actions={
          rfps.length > 0 ? (
            <div className="mt-6 flex w-full gap-3 overflow-x-auto p-1 pb-2">
              {rfps.map((rfp) => (
                <Link
                  key={rfp.number}
                  href={`${ROUTES.rfps}/${rfp.slug}`}
                  className="flex w-[min(272px,90%)] shrink-0 cursor-pointer flex-col rounded-xl border border-brand-dark-green/50 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark-green"
                >
                  <p className="font-mono text-xs">{rfp.number}</p>
                  <h4 className="mt-1 text-subhead-sans">{rfp.title}</h4>
                  <div className="mt-2 flex gap-2">
                    <p className="line-clamp-2 text-mono-s">{rfp.summary}</p>
                    {rfp.image && (
                      <Image
                        src={rfp.image.src}
                        alt={rfp.image.alt}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded object-cover"
                      />
                    )}
                  </div>
                  <span className="mt-auto pt-2 font-mono text-xs underline underline-offset-3">
                    {rfpLinkLabel}
                  </span>
                </Link>
              ))}
            </div>
          ) : undefined
        }
      >
        {rfps.length === 0 && <p className="mt-6 text-mono-s">{noOpenRfps}</p>}
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

/** External URLs open in a new tab and skip the locale prefix, as the app
 * Button does. */
function PanelLink({
  link,
  className,
  children,
}: {
  link: ProgramPanelLink
  className: string
  children?: ReactNode
}) {
  if (/^https?:\/\//.test(link.href)) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.ariaLabel}
        data-umami-event-name={link.eventName}
        className={className}
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
      className={className}
    >
      {children}
    </Link>
  )
}

function ProgramPanel({
  link,
  overlay = false,
  className,
  children,
}: {
  link?: ProgramPanelLink
  /**
   * Lays the link over the panel instead of wrapping it, so links inside the
   * panel stay clickable (links cannot nest).
   */
  overlay?: boolean
  className: string
  children: ReactNode
}) {
  if (!link) {
    return <div className={className}>{children}</div>
  }

  if (overlay) {
    return (
      <div className={`relative ${className}`}>
        <PanelLink
          link={link}
          className={`absolute inset-0 z-[1] rounded-[inherit] ${PANEL_FOCUS_CLASSNAME}`}
        />
        {children}
      </div>
    )
  }

  return (
    <PanelLink link={link} className={`${className} ${PANEL_FOCUS_CLASSNAME}`}>
      {children}
    </PanelLink>
  )
}

interface ProgramImagePanelProps {
  link?: ProgramPanelLink
  image: MediaRef
  /** Brand mark above the title. */
  mark: ReactNode
  title: string
  description: string
  featured?: ReactNode
}

export function ProgramImagePanel({
  link,
  image,
  mark,
  title,
  description,
  featured,
}: ProgramImagePanelProps) {
  return (
    <ProgramPanel
      link={link}
      className={`relative flex h-[370px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-10 text-center text-brand-off-white ${featured ? 'gap-5' : 'gap-10'}`}
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
      {featured}
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
  /**
   * Links under the copy. They sit above the panel link, which then lies over
   * the panel rather than wrapping it.
   */
  actions?: ReactNode
}

export function ProgramOutlinePanel({
  link,
  mark,
  title,
  description,
  children,
  actions,
}: ProgramOutlinePanelProps) {
  return (
    <ProgramPanel
      link={link}
      overlay={Boolean(actions)}
      className="flex h-[370px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green px-4 py-10"
    >
      {mark ? <div className="mb-10">{mark}</div> : null}
      <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center">
        <h3 className="text-subhead-sans">{title}</h3>
        <p className="w-full max-w-[338px] text-mono-s">{description}</p>
        {actions ? (
          <div className="relative z-[2] w-full min-w-0 text-mono-s">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </ProgramPanel>
  )
}
