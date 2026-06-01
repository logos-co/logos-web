import Image from 'next/image'
import type { ReactNode } from 'react'

import {
  type Circle,
  type CircleEvent,
  type CircleInitiative,
  formatEventDateForSurface,
} from '@repo/content/loaders'
import type { CirclesSettings, Language } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

import { IconMask } from '@/components/icons/icon-mask'

import { ArrowIcon, isExternalHref, SmartLink } from './_helpers'

type CircleDetailPageViewProps = {
  circle: Circle
  events: CircleEvent[]
  initiatives: CircleInitiative[]
  settings: CirclesSettings
  locale: Language
}

function MaskIcon({ name }: { name: 'calendar' | 'clock' | 'map-pin' }) {
  return <IconMask src={`/icons/${name}.svg`} className="size-[15px]" />
}

const formatHostList = (hosts: { name: string }[]) => {
  if (hosts.length === 0) return ''
  if (hosts.length === 1) return `By ${hosts[0]?.name ?? ''}`
  const allButLast = hosts.slice(0, -1).map((host) => host.name)
  const last = hosts.at(-1)?.name
  return `By ${allButLast.join(', ')} & ${last}`
}

function CircleLogo({ size }: { size: 'small' | 'large' }) {
  const frame = size === 'large' ? 'size-7' : 'size-[23px]'
  const markSize = size === 'large' ? 9 : 7
  return (
    <span
      className={`flex ${frame} shrink-0 items-center justify-center rounded-full border border-brand-dark-green`}
    >
      <LogosMark size={markSize} className="text-brand-dark-green" />
    </span>
  )
}

function DetailHero({
  circle,
  settings,
}: {
  circle: Circle
  settings: CirclesSettings
}) {
  const stats = [
    ['Members', circle.memberCount?.toString() ?? '-'],
    ['Discord', circle.discordChannel ? `#${circle.discordChannel}` : '-'],
    ['Forum', circle.forumUrl ?? '-'],
  ] as const

  return (
    <section className="relative h-auto min-h-[291px] bg-brand-off-white px-3 pt-10 md:h-[334px] md:pb-0">
      <ContentWidth className="relative h-full">
      <SmartLink
        href={circle.detailBackLink.href}
        className="absolute left-3 top-[-20px] inline-flex items-center gap-1 px-0 py-2 text-brand-dark-green"
      >
        <ArrowIcon direction="left" />
        <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          {circle.detailBackLink.label}
        </span>
      </SmartLink>

      <div className="flex items-center gap-3 md:absolute md:left-3 md:top-10">
        <CircleLogo size="large" />
        <h1 className="font-display text-[30px] leading-none text-brand-dark-green md:text-[36px]">
          {circle.name}
        </h1>
      </div>

      <div className="mt-10 grid gap-10 md:absolute md:left-[calc(50%+6px)] md:top-10 md:mt-0 md:w-[345px] md:gap-7">
        <div className="flex flex-col items-start gap-3">
          <p className="text-mono-s max-w-[369px] text-brand-dark-green md:max-w-[342px]">
            {circle.description}
          </p>

          <Button
            href={circle.joinUrl}
            variant="secondary"
            className="md:hidden"
            {...(isExternalHref(circle.joinUrl)
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {settings.detailJoinCtaLabel}
          </Button>
        </div>

        <dl className="text-mono-s w-full text-brand-dark-green">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[83px_minmax(0,1fr)] gap-3 border-t border-brand-dark-green/10 py-1.5 md:grid-cols-[107px_minmax(0,1fr)]"
            >
              <dt className="font-mono text-[10px] font-medium uppercase leading-[1.3]">
                {label}
              </dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Button
        href={circle.joinUrl}
        variant="secondary"
        className="hidden md:absolute md:left-[calc(83.333%+2px)] md:top-10 md:mt-0 md:inline-flex"
        {...(isExternalHref(circle.joinUrl)
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {settings.detailJoinCtaLabel}
      </Button>
      </ContentWidth>
    </section>
  )
}

function EventMeta({
  icon,
  children,
}: {
  icon: 'calendar' | 'clock' | 'map-pin'
  children: ReactNode
}) {
  return (
    <p className="text-mono-s flex items-center gap-1.5 text-brand-dark-green">
      <MaskIcon name={icon} />
      <span className="min-w-0 truncate">{children}</span>
    </p>
  )
}

function CircleEventCard({
  event,
  locale,
}: {
  event: CircleEvent
  locale: Language
}) {
  const date = formatEventDateForSurface(event, 'detail-date', locale)
  const time = formatEventDateForSurface(event, 'detail-time', locale)
  const hostList = formatHostList(event.hostedBy)
  const content = (
    <>
      <div className="relative h-[173px] w-full shrink-0 overflow-hidden rounded-[18px] md:h-full md:min-h-[123px] md:w-[339px]">
        {event.image ? (
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            sizes="(max-width: 768px) 356px, 339px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between px-1.5 py-1 md:h-full md:px-0">
        <CircleLogo size="small" />

        <div className="flex flex-col gap-3">
          <h3 className="truncate font-sans text-[18px] leading-[1.15] tracking-normal text-brand-dark-green">
            {event.title}
          </h3>
          <div className="flex flex-col">
            <EventMeta icon="calendar">{date}</EventMeta>
            <EventMeta icon="clock">{time}</EventMeta>
            <EventMeta icon="map-pin">
              {event.venueName ?? event.locationLabel}
            </EventMeta>
          </div>
        </div>

        {hostList ? (
          <div className="text-mono-s flex min-w-0 items-center gap-1.5 text-gray-05">
            <span className="flex items-start pr-2">
              <span className="mr-[-8px] size-[13px] rounded-full bg-gray-04" />
              <span className="mr-[-8px] size-[13px] rounded-full bg-gray-03" />
              <span className="mr-[-8px] size-[13px] rounded-full bg-gray-02" />
            </span>
            <span className="truncate">{hostList}</span>
          </div>
        ) : null}
      </div>
    </>
  )

  const className =
    'flex h-[340px] w-full flex-col gap-3 rounded-[24px] bg-gray-01 pb-3 pl-1.5 pr-6 pt-1.5 text-brand-dark-green md:h-[234px] md:flex-row md:gap-3 md:p-1.5 md:pr-6'

  if (event.eventUrl) {
    return (
      <SmartLink
        href={event.eventUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} transition-colors hover:bg-gray-02`}
      >
        {content}
      </SmartLink>
    )
  }

  return <article className={className}>{content}</article>
}

function SectionShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <ContentWidth>
        <div className="flex flex-col gap-3 px-3">
          <div className="flex justify-start md:justify-end">
            <h2 className="font-mono text-[10px] font-medium uppercase leading-[1.3] text-brand-dark-green">
              {title}
            </h2>
          </div>
          <div className="h-px w-full bg-brand-dark-green/10" />
          {children}
        </div>
      </ContentWidth>
    </section>
  )
}

function EventsSection({
  events,
  locale,
}: {
  events: CircleEvent[]
  locale: Language
}) {
  if (events.length === 0) return null

  return (
    <SectionShell title="Upcoming Events">
      <div className="grid gap-3 md:grid-cols-2">
        {events.map((event) => (
          <CircleEventCard key={event.slug} event={event} locale={locale} />
        ))}
      </div>
    </SectionShell>
  )
}

function InitiativeCard({ initiative }: { initiative: CircleInitiative }) {
  return (
    <SmartLink
      href={initiative.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative h-[282px] overflow-hidden rounded-[12px] bg-brand-dark-green text-brand-off-white"
    >
      <Image
        src={initiative.image.src}
        alt={initiative.image.alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover blur-[20px] transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-3 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex size-[15px] items-center justify-center rounded-full border border-brand-off-white">
            <LogosMark size={5} />
          </span>
          <span className="font-display text-[18px] leading-[1.1]">
            {initiative.locationLabel.split(',')[0]}
          </span>
        </div>

        <h3 className="mx-auto max-w-[260px] text-center font-sans text-[18px] leading-[1.15] tracking-normal">
          {initiative.title}
        </h3>

        <p className="text-mono-s max-w-[220px] overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {initiative.description}
        </p>
      </div>

      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green">
        <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          {initiative.ctaLabel}
        </span>
        <ArrowIcon />
      </span>
    </SmartLink>
  )
}

function InitiativesSection({
  initiatives,
}: {
  initiatives: CircleInitiative[]
}) {
  if (initiatives.length === 0) return null

  return (
    <SectionShell title="Initiatives">
      <div className="grid gap-3 md:grid-cols-2">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.slug} initiative={initiative} />
        ))}
      </div>
    </SectionShell>
  )
}

export default function CircleDetailPageView({
  circle,
  events,
  initiatives,
  settings,
  locale,
}: CircleDetailPageViewProps) {
  return (
    <main className="flex flex-col gap-[100px] bg-brand-off-white pb-[100px] pt-20">
      <DetailHero circle={circle} settings={settings} />
      <EventsSection events={events} locale={locale} />
      <InitiativesSection initiatives={initiatives} />
    </main>
  )
}
