import Image from 'next/image'

import {
  type Circle,
  type CircleEventDateGroup,
  type CircleInitiative,
  type CircleResource,
  formatEventDateForSurface,
} from '@repo/content/loaders'
import type { CirclesSettings, Language } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { ROUTE_AVAILABILITY } from '@/constants/route-availability'
import { formatTzOffsetLabel } from '@/lib/dates'

import { ArrowIcon, isExternalHref, SmartLink } from './_helpers'
import CirclesMap from './circles-map'

type CirclesPageProps = {
  settings: CirclesSettings
  circles: Circle[]
  eventGroups: CircleEventDateGroup[]
  initiatives: CircleInitiative[]
  resources: CircleResource[]
  locale: Language
}

const formatHostList = (hosts: { name: string }[]) =>
  hosts.length > 0 ? `By ${hosts.map((host) => host.name).join(', ')}` : ''

function SectionIntro({
  title,
  description,
  cta,
}: {
  title: string
  description?: string
  cta?: { label: string; href: string; external?: boolean }
}) {
  return (
    <ContentWidth className="grid grid-cols-2 gap-3 px-3 py-10 md:grid-cols-12 md:py-10">
      <h2 className="font-display text-[30px] leading-none text-brand-dark-green md:col-span-4 md:text-[36px]">
        {title}
      </h2>
      {description ? (
        <p className="text-mono-s col-start-2 text-brand-dark-green md:col-span-3 md:col-start-7 md:w-[226px]">
          {description}
        </p>
      ) : null}
      {cta ? (
        <Button
          href={cta.href}
          variant="link"
          className="col-start-2 w-fit self-start md:col-span-2 md:col-start-11"
          {...(cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {cta.label}
        </Button>
      ) : null}
    </ContentWidth>
  )
}

function CirclesHero({
  settings,
  circles,
}: {
  settings: CirclesSettings
  circles: Circle[]
}) {
  const { hero } = settings
  const mobileHeroImage = circles[0]?.image

  return (
    <section className="relative h-[494px] bg-brand-off-white px-3 md:h-auto md:min-h-[579px] md:pt-10">
      {mobileHeroImage ? (
        <div className="absolute left-3 top-6 h-[75px] w-[107px] overflow-hidden md:hidden">
          <Image
            src={mobileHeroImage.src}
            alt={mobileHeroImage.alt}
            fill
            sizes="107px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {hero.topRightCta ? (
        <Button
          href={hero.topRightCta.href}
          variant="tertiary"
          className="absolute right-3 top-6 hidden md:inline-flex"
          {...(hero.topRightCta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {hero.topRightCta.label}
        </Button>
      ) : (
        <p className="text-mono-s absolute right-3 top-6 hidden w-[226px] text-brand-dark-green md:block">
          {hero.eyebrow ?? 'Local chapters'}
        </p>
      )}

      <Button
        href={hero.joinCta.href}
        variant="tertiary"
        className="absolute left-[calc(50%+6px)] top-6 translate-x-0 px-0 md:left-1/2 md:-translate-x-1/2"
        icon={<ArrowIcon />}
        {...(hero.joinCta.external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {hero.joinCta.label}
      </Button>

      <div className="mx-auto flex max-w-360 flex-col">
        <div className="absolute inset-x-0 top-[130px] flex justify-center md:relative md:top-auto md:mt-[119px]">
          <h1 className="flex items-center gap-2 font-display text-[40px] leading-none text-brand-dark-green md:text-[48px]">
            <span className="flex size-[41px] items-center justify-center rounded-full border border-brand-dark-green/50 md:size-[41px]">
              <LogosMark
                size={16}
                className="hidden text-brand-dark-green md:inline-block"
              />
            </span>
            {hero.title}
          </h1>
        </div>

        <div className="absolute left-3 top-[274px] grid w-[calc(100%-24px)] gap-6 md:static md:mt-[156px] md:w-auto md:grid-cols-12 md:gap-3">
          <p className="text-mono-s hidden text-brand-dark-green md:col-span-2 md:block">
            {hero.eyebrow ?? 'Local chapters at the heart of Logos.'}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:col-span-4 md:col-start-7 md:flex md:flex-col md:items-start">
            <p className="text-mono-s col-span-2 max-w-[422px] text-brand-dark-green">
              {hero.description}
            </p>
            <Button
              href={hero.joinCta.href}
              variant="tertiary"
              className="col-start-2 w-fit px-0 md:hidden"
              icon={<ArrowIcon />}
              {...(hero.joinCta.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {hero.joinCta.label}
            </Button>
            <Button
              href={hero.findCta.href}
              variant="tertiary"
              className="hidden px-0 md:inline-flex"
              icon={<ArrowIcon />}
            >
              {hero.findCta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function NearbyCta({ settings }: { settings: CirclesSettings }) {
  return (
    <section className="bg-brand-off-white px-3 pb-[100px] pt-10 text-center md:pb-20 md:pt-1">
      <div className="mx-auto flex max-w-[464px] flex-col items-center gap-4 text-brand-dark-green md:gap-4">
        <h2 className="font-display text-[30px] leading-none md:text-[36px]">
          {settings.nearbyCta.title}
        </h2>
        {settings.nearbyCta.description ? (
          <p className="text-mono-s max-w-[345px]">
            {settings.nearbyCta.description}
          </p>
        ) : null}
        <Button
          href={settings.nearbyCta.cta.href}
          className="px-3 py-2"
          {...(settings.nearbyCta.cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {settings.nearbyCta.cta.label}
        </Button>
      </div>
    </section>
  )
}

function EventCard({
  event,
  locale,
}: {
  event: CircleEventDateGroup['events'][number]
  locale: Language
}) {
  const time = formatEventDateForSurface(event, 'index-card-time', locale)
  const offset = formatTzOffsetLabel(event.timezone, event.startsAt)
  const hostList = formatHostList(event.hostedBy)
  const href =
    event.eventUrl ??
    (ROUTE_AVAILABILITY.circleDetailLinks
      ? ROUTES.circle(event.circleSlug)
      : `${ROUTES.circles}#events`)

  return (
    <SmartLink
      href={href}
      className="grid w-full grid-cols-[123px_minmax(0,1fr)] gap-3 rounded-[24px] bg-gray-01 p-1.5 pr-6 text-brand-dark-green transition-colors hover:bg-gray-02 md:w-[463px]"
      {...(event.eventUrl
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      <div className="relative size-[123px] overflow-hidden rounded-[18px]">
        {event.image ? (
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            sizes="123px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col justify-between py-1">
        <h3 className="truncate font-sans text-[18px] leading-[1.15] tracking-normal">
          {event.title}
        </h3>
        <div className="flex flex-col gap-0.5">
          <p className="text-mono-s flex items-center gap-1.5 text-gray-05">
            <span>{time}</span>
            <span className="size-0.5 rounded-full bg-gray-04" />
            <span className="text-brand-dark-green">{offset}</span>
          </p>
          <p className="text-mono-s truncate text-gray-05">
            {event.locationLabel}
          </p>
          {hostList ? (
            <p className="text-mono-s truncate text-gray-05">{hostList}</p>
          ) : null}
        </div>
      </div>
    </SmartLink>
  )
}

function EventsSection({
  settings,
  groups,
  locale,
}: {
  settings: CirclesSettings
  groups: CircleEventDateGroup[]
  locale: Language
}) {
  return (
    <section
      id="events"
      className="border-t border-brand-dark-green/10 bg-brand-off-white"
    >
      <SectionIntro
        title={settings.eventsSection.title}
        description={settings.eventsSection.description}
        cta={settings.eventsSection.calendarCta}
      />

      <ContentWidth className="flex flex-col gap-6 pb-12">
        {groups.map((group) => (
          <div
            key={group.groupKey}
            className="grid gap-3 border-t border-brand-dark-green/10 px-3 pt-3 md:grid-cols-12"
          >
            <p className="text-eyebrow text-brand-dark-green md:col-span-2">
              {group.date}{' '}
              <span className="font-normal">/ {group.weekday}</span>
            </p>
            <div className="flex flex-col gap-3 md:col-span-8 md:col-start-3 md:flex-row md:flex-wrap">
              {group.events.map((event) => (
                <EventCard key={event.slug} event={event} locale={locale} />
              ))}
            </div>
          </div>
        ))}
      </ContentWidth>
    </section>
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
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover blur-[8px] transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-3 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex size-[15px] items-center justify-center rounded-full border border-brand-off-white">
            <LogosMark size={5} />
          </span>
          <span className="font-display text-[18px] leading-[1.1]">
            {initiative.locationLabel.split(',')[0]}
          </span>
        </div>
        <h3 className="mx-auto max-w-[280px] text-center font-sans text-[18px] leading-[1.15]">
          {initiative.title}
        </h3>
        <p className="text-mono-s max-w-[220px] overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] md:[-webkit-line-clamp:unset]">
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
  settings,
  initiatives,
}: {
  settings: CirclesSettings
  initiatives: CircleInitiative[]
}) {
  return (
    <section
      id="initiatives"
      className="border-t border-brand-dark-green/10 bg-brand-off-white"
    >
      <SectionIntro
        title={settings.initiativesSection.title}
        cta={settings.initiativesSection.cta}
      />
      <ContentWidth className="grid gap-3 px-3 pb-12 md:grid-cols-3">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.slug} initiative={initiative} />
        ))}
      </ContentWidth>
    </section>
  )
}

function ResourcesSection({
  settings,
  resources,
}: {
  settings: CirclesSettings
  resources: CircleResource[]
}) {
  return (
    <section
      id="resources"
      className="border-t border-brand-dark-green/10 bg-brand-off-white pb-15"
    >
      <SectionIntro
        title={settings.resourcesSection.title}
        description={settings.resourcesSection.description}
        cta={settings.resourcesSection.helpCenterCta}
      />

      <ContentWidth>
        <ul className="w-full">
          {resources.map((resource, index) => (
          <li key={resource.slug}>
            <SmartLink
              href={resource.href}
              className={`grid min-h-[58px] grid-cols-[minmax(0,1fr)_83px] items-center gap-3 px-3 py-3 text-brand-dark-green transition-colors hover:bg-brand-dark-green/10 md:min-h-[50px] md:grid-cols-12 md:items-start ${
                index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
              }`}
              target={isExternalHref(resource.href) ? '_blank' : undefined}
              rel={
                isExternalHref(resource.href)
                  ? 'noopener noreferrer'
                  : undefined
              }
            >
              <div className="flex gap-3 md:col-span-4">
                <span className="w-[26px] font-sans text-[14px] font-medium leading-[1.2]">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className="font-display text-[14px] leading-[1.2]">
                  {resource.title}
                </span>
              </div>
              <p className="text-mono-s hidden md:col-span-4 md:col-start-7 md:block md:w-[312px]">
                {resource.description}
              </p>
              <span className="text-eyebrow w-fit justify-self-end border-b border-brand-dark-green/50 md:col-span-2 md:col-start-11 md:justify-self-start">
                {resource.ctaLabel}
              </span>
            </SmartLink>
          </li>
        ))}
        </ul>
      </ContentWidth>
    </section>
  )
}

export default function CirclesPageView({
  settings,
  circles,
  eventGroups,
  initiatives,
  resources,
  locale,
}: CirclesPageProps) {
  return (
    <main className="bg-brand-off-white">
      <CirclesHero settings={settings} circles={circles} />
      <CirclesMap settings={settings} circles={circles} />
      <NearbyCta settings={settings} />
      <EventsSection settings={settings} groups={eventGroups} locale={locale} />
      <InitiativesSection settings={settings} initiatives={initiatives} />
      <ResourcesSection settings={settings} resources={resources} />
    </main>
  )
}
