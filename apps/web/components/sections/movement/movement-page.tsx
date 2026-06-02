import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

import type { CirclesSettings } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import CirclesMap from '@/components/sections/circles/circles-map'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import type { ActiveCircleMarker } from '@/lib/active-circles'
import { Link } from '@/i18n/navigation'

type Translate = (key: string) => string

type CtaTone = 'primary' | 'secondary' | 'tertiary' | 'light' | 'link'

type CtaProps = {
  href: string
  label: string
  tone?: CtaTone
  className?: string
}

const movementImages = {
  heroThumb: '/images/movement/hero-thumb.webp',
  activism: '/images/movement/action-activism.webp',
  coalition: '/images/movement/action-coalition.webp',
  building: '/images/movement/action-building.webp',
  campaign: '/images/movement/campaign-sunset.webp',
  issueLosAngeles: '/images/movement/issue-los-angeles.webp',
  issueLondon: '/images/movement/issue-london.webp',
  issuePorto: '/images/movement/issue-porto.webp',
  event: '/images/movement/event-florianopolis.webp',
  coalitionBg: '/images/movement/coalition-bg.webp',
} as const

const ctaToneClass: Record<CtaTone, string> = {
  primary: 'rounded-xl bg-brand-dark-green px-3 py-2 text-brand-off-white',
  secondary:
    'border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green',
  tertiary: 'text-brand-dark-green',
  light: 'rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green',
  link: 'text-brand-dark-green',
}

function Cta({ href, label, tone = 'primary', className }: CtaProps) {
  const isExternal = href.startsWith('http')
  const classes = `inline-flex cursor-pointer items-center justify-center gap-1 font-mono text-[10px] font-semibold leading-[1.35] uppercase backdrop-blur-[5px] transition-opacity hover:opacity-70 ${ctaToneClass[tone]} ${className ?? ''}`
  const content = (
    <>
      <span
        className={tone === 'link' ? 'border-b border-current/50 pb-[2px]' : ''}
      >
        {label}
      </span>
      <IconMask src="/icons/right-arrow.svg" className="size-[15px]" />
    </>
  )

  if (isExternal) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  )
}

function LambdaBadge({
  size = 23,
  tone = 'dark',
  className,
  style,
}: {
  size?: number
  tone?: 'dark' | 'light' | 'yellow'
  className?: string
  style?: CSSProperties
}) {
  const toneClass =
    tone === 'yellow'
      ? 'border-brand-yellow bg-brand-yellow text-brand-dark-green'
      : tone === 'light'
        ? 'border-brand-off-white text-brand-off-white'
        : 'border-brand-dark-green text-brand-dark-green'

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border ${toneClass} ${className ?? ''}`}
      style={{ width: size, height: size, ...style }}
    >
      <LogosMark size={Math.max(4, Math.round(size * 0.4))} />
    </span>
  )
}

function SectionHeader({
  title,
  description,
  cta,
  className,
  titleClassName,
  descriptionClassName,
}: {
  title: ReactNode
  description: string
  cta?: ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}) {
  return (
    <ContentWidth
      className={`grid grid-cols-1 gap-4 px-3 pt-10 text-brand-dark-green md:grid-cols-12 md:gap-3 ${className ?? ''}`}
    >
      <h2 className={`text-h3-serif md:col-span-5 ${titleClassName ?? ''}`}>
        {title}
      </h2>
      <p
        className={`text-mono-s max-w-[456px] md:col-span-3 md:col-start-7 ${descriptionClassName ?? ''}`}
      >
        {description}
      </p>
      {cta ? <div className="md:col-span-2 md:col-start-11">{cta}</div> : null}
    </ContentWidth>
  )
}

function HeroSection({ t }: { t: Translate }) {
  return (
    <section className="relative h-[494px] overflow-hidden bg-brand-off-white px-3 pt-6 text-brand-dark-green md:h-[579px]">
      <ContentWidth className="relative h-full">
      <div className="relative h-[75px] w-[107px] overflow-hidden bg-gray-01">
        <Image
          src={movementImages.heroThumb}
          alt=""
          fill
          priority
          sizes="107px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <Cta
        href={ROUTES.circles}
        label={t('hero.primaryCta')}
        tone="tertiary"
        className="absolute top-6 left-1/2 translate-x-[8px] md:translate-x-[6px]"
      />
      <p className="text-mono-s absolute top-6 left-[calc(83.333%+2px)] hidden w-[226px] md:block">
        {t('hero.kicker')}
      </p>

      <div className="absolute top-[130px] left-1/2 flex w-[348px] -translate-x-1/2 items-center justify-center gap-2.5 md:w-auto">
        <LambdaBadge size={41} />
        <h1 className="font-display text-[36px] leading-none tracking-[-0.03em] whitespace-nowrap md:text-[56px]">
          {t('hero.title')}
        </h1>
      </div>

      <div className="absolute top-[274px] left-1/2 w-[369px] max-w-[calc(100%-24px)] -translate-x-1/2 md:top-[337px] md:w-[min(422px,calc(50vw-18px))] md:max-w-none md:translate-x-[6px] lg:w-[422px]">
        <p className="text-mono-s">{t('hero.body')}</p>
        <Cta
          href={ROUTES.circles}
          label={t('hero.secondaryCta')}
          tone="tertiary"
          className="mt-10 ml-[191px] md:ml-0"
        />
      </div>
      </ContentWidth>
    </section>
  )
}

function ActionCardsSection({ t }: { t: Translate }) {
  const cards = [
    {
      key: 'activism',
      image: movementImages.activism,
      href: ROUTES.circles,
    },
    {
      key: 'coalition',
      image: movementImages.coalition,
      href: EXTERNAL_URLS.forum,
    },
    {
      key: 'building',
      image: movementImages.building,
      href: ROUTES.buildersHub,
    },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pt-10 pb-10 md:pt-0 md:pb-[70px]">
      <SectionHeader
        title={
          <>
            {t('intro.titleLine1')}
            <br />
            {t('intro.titleLine2')}
          </>
        }
        description={t('intro.body')}
        className="pb-10 md:pt-6 md:pb-[60px]"
        titleClassName="max-w-[244px]"
      />
      <ContentWidth className="grid gap-3 px-3 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.key}
            className="flex flex-col gap-3 rounded-3xl bg-gray-01 p-1.5 pb-3 text-brand-dark-green md:min-h-[412px]"
          >
            <div className="relative h-[273px] overflow-hidden rounded-[18px]">
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="flex gap-3 px-1.5 pt-1">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <LambdaBadge size={23} />
                  <h3 className="text-subhead-sans">
                    {t(`actions.${card.key}.title`)}
                  </h3>
                </div>
              </div>
              <p className="text-mono-s flex-1">
                {t(`actions.${card.key}.body`)}
              </p>
            </div>
            <Cta
              href={card.href}
              label={t(`actions.${card.key}.cta`)}
              tone="light"
              className="mx-1.5 mt-auto w-[calc(100%-12px)]"
            />
          </article>
        ))}
      </ContentWidth>
    </section>
  )
}

function CampaignSection({ t }: { t: Translate }) {
  return (
    <section className="bg-brand-off-white px-3 py-10 md:py-0">
      <ContentWidth className="grid overflow-hidden rounded-xl bg-gray-01 p-3 text-brand-dark-green md:grid-cols-2 md:gap-3">
        <div className="flex min-h-[462px] flex-col justify-between p-3 md:min-h-[462px]">
          <div className="flex gap-[88px]">
            <LogosMark size={7} />
            <p className="text-eyebrow w-[185px]">{t('campaign.eyebrow')}</p>
          </div>
          <div className="mx-auto flex max-w-[678px] flex-col items-center gap-10 text-center">
            <div className="flex max-w-[320px] flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-3">
                <p className="text-eyebrow">{t('campaign.kicker')}</p>
                <h2 className="text-h3-sans">{t('campaign.title')}</h2>
              </div>
              <p className="text-caption-sans font-medium">
                {t('campaign.body')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <Cta href={ROUTES.circles} label={t('campaign.primaryCta')} />
              <Cta
                href={ROUTES.circles}
                label={t('campaign.secondaryCta')}
                tone="secondary"
              />
              <Cta
                href={EXTERNAL_URLS.discord}
                label={t('campaign.tertiaryCta')}
                tone="tertiary"
              />
            </div>
          </div>
          <div aria-hidden="true" className="opacity-0">
            <LogosMark size={7} />
          </div>
        </div>
        <div className="relative min-h-[270px] overflow-hidden rounded-[40px] md:min-h-[462px]">
          <Image
            src={movementImages.campaign}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </ContentWidth>
    </section>
  )
}

function CenterCtaSection({
  title,
  body,
  cta,
  className,
}: {
  title: string
  body: string
  cta: ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-brand-off-white px-3 py-[100px] text-center text-brand-dark-green ${className ?? ''}`}
    >
      <div className="mx-auto flex max-w-[456px] flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-h3-serif">{title}</h2>
          <p className="text-mono-s">{body}</p>
        </div>
        {cta}
      </div>
    </section>
  )
}

function IssueCard({
  image,
  city,
  title,
  body,
}: {
  image: string
  city: string
  title: string
  body: string
}) {
  return (
    <article className="relative h-[282px] w-full shrink-0 overflow-hidden rounded-xl text-brand-off-white md:w-[440px]">
      <Image
        src={image}
        alt=""
        fill
        sizes="440px"
        className="scale-125 object-cover blur-[20px]"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-3 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <LambdaBadge size={15} tone="light" />
          <p className="text-subhead-serif">{city}</p>
        </div>
        <h3 className="text-subhead-sans mx-auto max-w-[220px] text-center">
          {title}
        </h3>
        <p className="text-mono-s w-[220px]">{body}</p>
      </div>
    </article>
  )
}

function ActivismSection({ t }: { t: Translate }) {
  const issues = [
    {
      image: movementImages.issueLosAngeles,
      city: t('activism.cards.losAngeles.city'),
      title: t('activism.cards.losAngeles.title'),
    },
    {
      image: movementImages.issueLondon,
      city: t('activism.cards.london.city'),
      title: t('activism.cards.london.title'),
    },
    {
      image: movementImages.issuePorto,
      city: t('activism.cards.porto.city'),
      title: t('activism.cards.porto.title'),
    },
    {
      image: movementImages.issueLosAngeles,
      city: t('activism.cards.losAngeles.city'),
      title: t('activism.cards.losAngeles.title'),
    },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-10 text-brand-dark-green md:pb-[100px]">
      <SectionHeader
        title={
          <>
            <span className="md:hidden">{t('activism.mobileTitle')}</span>
            <span className="hidden md:inline">{t('activism.title')}</span>
          </>
        }
        description={t('activism.body')}
        cta={<Cta href={ROUTES.circles} label={t('activism.cta')} />}
        className="pb-10 md:pb-[78px]"
      />
      <ContentWidth className="overflow-hidden">
        <div className="grid gap-3 px-3 md:flex md:w-max">
          {issues.map((issue, index) => (
            <IssueCard
              key={`${issue.city}-${index}`}
              image={issue.image}
              city={issue.city}
              title={issue.title}
              body={t('activism.cardBody')}
            />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

function EventCard({ t }: { t: Translate }) {
  return (
    <article className="flex w-full shrink-0 items-center gap-3 rounded-3xl bg-gray-01 py-1.5 pr-3 pl-1.5 text-brand-dark-green md:w-[463px] md:pr-6">
      <div className="relative size-[123px] shrink-0 overflow-hidden rounded-[18px]">
        <Image
          src={movementImages.event}
          alt=""
          fill
          sizes="123px"
          className="object-cover"
        />
      </div>
      <div className="flex h-[123px] min-w-0 flex-col justify-between py-1">
        <h3 className="text-subhead-sans max-w-[193px] md:max-w-none md:whitespace-nowrap">
          {t('events.card.title')}
        </h3>
        <div className="flex flex-col gap-0.5">
          <p className="text-mono-s text-gray-05">
            {t('events.card.time')}{' '}
            <span className="text-brand-dark-green">
              {t('events.card.timezone')}
            </span>
          </p>
          <p className="text-mono-s text-gray-05">
            {t('events.card.location')}
          </p>
          <p className="text-mono-s max-w-[185px] text-gray-05">
            {t('events.card.hosts')}
          </p>
        </div>
      </div>
    </article>
  )
}

function EventsSection({ t }: { t: Translate }) {
  const rows = [
    { key: 'day1', cards: 2 },
    { key: 'day2', cards: 1 },
    { key: 'day3', cards: 2 },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-10 text-brand-dark-green md:pb-[100px]">
      <SectionHeader
        title={t('events.title')}
        description={t('events.body')}
        cta={
          <Cta href={ROUTES.circles} label={t('events.cta')} tone="tertiary" />
        }
        className="pb-10 md:pb-[73px]"
        descriptionClassName="max-w-[178px]"
      />
      <ContentWidth className="flex flex-col gap-10">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-3">
            <div className="flex gap-1.5 px-3 text-eyebrow">
              <p className="w-[70px]">{t(`events.${row.key}.date`)}</p>
              <p className="text-brand-dark-green/50">
                {t(`events.${row.key}.weekday`)}
              </p>
            </div>
            <div className="mx-3 h-px bg-brand-dark-green/10" />
            <div className="flex flex-col gap-3 overflow-hidden px-3 md:flex-row">
              {Array.from({ length: row.cards }).map((_, index) => (
                <EventCard key={`${row.key}-${index}`} t={t} />
              ))}
            </div>
          </div>
        ))}
      </ContentWidth>
    </section>
  )
}

function GetInvolvedSection({ t }: { t: Translate }) {
  return (
    <section className="bg-brand-off-white px-3 py-10 text-brand-dark-green">
      <ContentWidth className="grid gap-3 md:grid-cols-2">
      <div className="flex h-[270px] flex-col items-center justify-center gap-8 border border-brand-dark-green p-4 text-center md:h-[500px] md:gap-10">
        <div className="flex max-w-[337px] flex-col items-center gap-3 md:max-w-[380px]">
          <h2 className="text-subhead-sans">{t('involved.title')}</h2>
          <p className="text-mono-s">{t('involved.body')}</p>
        </div>
        <div className="flex flex-col items-center gap-1 md:flex-row">
          <Cta href={EXTERNAL_URLS.twitter} label={t('involved.primaryCta')} />
          <Cta
            href={EXTERNAL_URLS.discord}
            label={t('involved.secondaryCta')}
            tone="secondary"
          />
        </div>
      </div>
      <div className="relative flex h-[270px] items-center justify-center overflow-hidden rounded-[160px] text-center text-brand-off-white md:h-[500px] md:rounded-[200px]">
        <Image
          src={movementImages.coalitionBg}
          alt=""
          fill
          sizes="50vw"
          className="scale-125 object-cover blur-[30px]"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex max-w-[432px] flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-subhead-sans">{t('coalition.title')}</h2>
            <p className="text-mono-s max-w-[236px] md:max-w-[380px]">
              {t('coalition.body')}
            </p>
          </div>
          <Cta
            href={EXTERNAL_URLS.forum}
            label={t('coalition.cta')}
            tone="light"
          />
        </div>
      </div>
      </ContentWidth>
    </section>
  )
}

function BuilderSection({ t }: { t: Translate }) {
  const details = ['problem', 'solution', 'stack']

  return (
    <section className="bg-brand-off-white pt-0 pb-10 text-brand-dark-green md:pb-[100px]">
      <CenterCtaSection
        title={t('builder.title')}
        body={t('builder.body')}
        cta={
          <div className="flex flex-wrap justify-center gap-1">
            <Cta href={ROUTES.buildersHub} label={t('builder.primaryCta')} />
            <Cta
              href={ROUTES.technologyStack}
              label={t('builder.secondaryCta')}
              tone="secondary"
            />
          </div>
        }
        className="md:py-[100px]"
      />
      <ContentWidth className="px-3">
        <article className="relative min-h-[506px] overflow-hidden rounded-xl text-brand-off-white md:min-h-[282px]">
          <Image
            src={movementImages.issueLosAngeles}
            alt=""
            fill
            sizes="100vw"
            className="scale-125 object-cover blur-[20px]"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative grid min-h-[506px] gap-8 p-3 md:min-h-[282px] md:grid-cols-2">
            <div className="flex min-h-[157px] flex-col justify-between md:min-h-[252px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <LambdaBadge size={15} tone="light" />
                  <p className="text-subhead-serif">
                    {t('builder.feature.city')}
                  </p>
                </div>
                <Cta
                  href={ROUTES.buildersHub}
                  label={t('builder.feature.cta')}
                  tone="light"
                  className="md:hidden"
                />
              </div>
              <h3 className="text-subhead-sans mx-auto max-w-[220px] text-center md:mx-0 md:text-left">
                {t('builder.feature.title')}
              </h3>
              <Cta
                href={ROUTES.buildersHub}
                label={t('builder.feature.cta')}
                tone="light"
                className="hidden w-fit md:inline-flex"
              />
            </div>
            <div className="flex flex-col justify-end gap-3">
              {details.map((detail) => (
                <div
                  key={detail}
                  className="grid gap-3 border-t border-brand-off-white/50 pt-1.5 md:grid-cols-2"
                >
                  <p className="text-eyebrow">
                    {t(`builder.details.${detail}.label`)}
                  </p>
                  <p className="text-mono-s">
                    {t(`builder.details.${detail}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </ContentWidth>
    </section>
  )
}

function ResourcesSection({ t }: { t: Translate }) {
  const rows = ['start', 'forum', 'discord']

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-[180px] text-brand-dark-green md:pb-[114px]">
      <SectionHeader
        title={
          <>
            {t('resources.titleLine1')}
            <br />
            {t('resources.titleLine2')}
          </>
        }
        description={t('resources.body')}
        cta={
          <Cta href={ROUTES.faq} label={t('resources.cta')} tone="tertiary" />
        }
        className="pb-10 md:pb-[54px]"
        descriptionClassName="max-w-[178px]"
      />
      <ContentWidth>
        {rows.map((row, index) => (
          <div
            key={row}
            className={`grid min-h-[58px] grid-cols-[1fr_auto] items-start gap-3 px-3 py-3 md:min-h-[50px] md:grid-cols-12 ${
              index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
            }`}
          >
            <div className="flex gap-3 text-[14px] leading-[1.2] md:col-span-6">
              <span className="font-sans font-medium">
                {t(`resources.rows.${row}.number`)}
              </span>
              <span className="font-display">
                {t(`resources.rows.${row}.title`)}
              </span>
            </div>
            <p className="text-mono-s hidden md:col-span-3 md:block">
              {t(`resources.rows.${row}.body`)}
            </p>
            <div className="md:col-span-2 md:col-start-11">
              <Cta
                href={
                  row === 'discord'
                    ? EXTERNAL_URLS.discord
                    : row === 'forum'
                      ? EXTERNAL_URLS.forum
                      : ROUTES.circles
                }
                label={t(`resources.rows.${row}.cta`)}
                tone="link"
              />
            </div>
          </div>
        ))}
      </ContentWidth>
    </section>
  )
}

export function MovementPageView({
  t,
  circlesSettings,
  mapMarkers,
}: {
  t: Translate
  circlesSettings: CirclesSettings
  mapMarkers: ActiveCircleMarker[]
}) {
  const findCta = (
    <CenterCtaSection
      title={t('find.title')}
      body={t('find.body')}
      cta={<Cta href={ROUTES.circles} label={t('find.cta')} />}
    />
  )

  return (
    <>
      <HeroSection t={t} />
      <ActionCardsSection t={t} />
      <CampaignSection t={t} />
      <div className="md:hidden">
        <CirclesMap settings={circlesSettings} markers={mapMarkers} />
      </div>
      <div className="hidden md:block">{findCta}</div>
      <div className="hidden md:block">
        <CirclesMap settings={circlesSettings} markers={mapMarkers} />
      </div>
      <div className="md:hidden">{findCta}</div>
      <ActivismSection t={t} />
      <EventsSection t={t} />
      <GetInvolvedSection t={t} />
      <BuilderSection t={t} />
      <ResourcesSection t={t} />
    </>
  )
}
