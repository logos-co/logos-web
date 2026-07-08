'use client'

import Image from 'next/image'
import { useState } from 'react'

import type { RoadmapCopySection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

type RoadmapAction = NonNullable<
  RoadmapCopySection['overview']['cards'][number]['cta']
>
type ReleaseItem = RoadmapCopySection['release']['items'][number]
type ReleaseModule = ReleaseItem['modules'][number]
type OverviewCard = RoadmapCopySection['overview']['cards'][number]

type RoadmapPageProps = {
  data: RoadmapCopySection
}

function isExternalHref(href: string) {
  return href.startsWith('https://')
}

function ArrowIcon() {
  return <IconMask src="/icons/arrow-right.svg" className="size-[15px]" />
}

function ActionPill({ action }: { action: RoadmapAction }) {
  const variant = action.variant ?? 'secondary'
  const className =
    variant === 'primary'
      ? 'inline-flex h-[31px] items-center justify-center gap-1 rounded-xl bg-brand-dark-green px-3 py-2 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap text-brand-off-white uppercase'
      : variant === 'light'
        ? 'inline-flex items-center justify-center rounded-md bg-accent-light-blue px-1.5 py-1 font-mono-body text-[10px] leading-[1.3] whitespace-nowrap text-brand-dark-green'
        : 'inline-flex h-[31px] items-center justify-center gap-1 px-3 py-2 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap text-brand-dark-green uppercase ring-1 ring-inset ring-brand-dark-green/50'

  const content = (
    <>
      <span>{action.label}</span>
      {variant === 'light' ? null : <ArrowIcon />}
    </>
  )

  if (!action.href) {
    return <span className={className}>{content}</span>
  }

  if (isExternalHref(action.href)) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} cursor-pointer`}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={action.href} className={`${className} cursor-pointer`}>
      {content}
    </Link>
  )
}

function RoadmapHero({ data }: { data: RoadmapCopySection['hero'] }) {
  return (
    <section className="relative h-[420px] bg-brand-off-white md:-mt-0.5 md:h-[447px]">
      <ContentWidth className="relative h-full">
        <div className="absolute top-6 left-0 h-[75px] w-[107px] overflow-hidden">
          <div className="absolute top-[-36px] left-0 h-[134px] w-[107px]">
            <Image
              src={data.image.src}
              alt={data.image.alt}
              fill
              sizes="107px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <p className="text-mono-s absolute top-6 left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[226px] text-brand-dark-green">
          {data.eyebrow}
        </p>

        <h1 className="text-h2 absolute top-[140px] left-1/2 w-[min(464px,calc(100vw-24px))] -translate-x-1/2 text-center whitespace-pre-line text-brand-dark-green [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {data.heading}
        </h1>

        <p className="text-mono-s absolute top-[307px] left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[226px] text-brand-dark-green">
          {data.disclaimer}
        </p>
      </ContentWidth>
    </section>
  )
}

function RoadmapRelease({ data }: { data: RoadmapCopySection['release'] }) {
  const [activeTab, setActiveTab] = useState(data.activeTab)
  const activeRelease =
    data.items.find((item) => item.tab === activeTab) ?? data.items[0]!

  return (
    <section className="mt-10 bg-brand-off-white pb-20 ring-1 ring-inset ring-brand-dark-green/10 md:pb-28">
      <ContentWidth>
        <div
          aria-label={data.tabsAriaLabel}
          role="tablist"
          className="flex max-w-full overflow-x-auto"
        >
          {data.items.map((item) => {
            const isActive = item.tab === activeRelease.tab
            return (
              <button
                key={item.tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`flex h-[34px] cursor-pointer items-center justify-center px-2.5 py-0 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase ring-1 ring-inset ring-brand-dark-green ${
                  isActive
                    ? 'bg-brand-dark-green text-brand-off-white'
                    : 'text-brand-dark-green'
                }`}
                onClick={() => setActiveTab(item.tab)}
              >
                {item.tab}
              </button>
            )
          })}
        </div>

        <div className="mt-16 flex flex-col gap-14 md:mt-[81px] desktop:flex-row desktop:items-center desktop:justify-between">
          <div className="w-full max-w-[345px] font-mono text-[10px] leading-[1.35] font-semibold whitespace-pre-line text-brand-dark-green uppercase">
            {activeRelease.status ? <p>{activeRelease.status}</p> : null}
            <p>
              {activeRelease.dateLabel}: {activeRelease.date}
            </p>
            <p className="mt-[14px]">
              {activeRelease.objectiveLabel}: {activeRelease.objective}
            </p>
            {activeRelease.body.map((paragraph) => (
              <p key={paragraph} className="mt-[14px]">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid gap-y-10 md:grid-cols-2 md:gap-x-5 desktop:w-[620px]">
            {activeRelease.modules.map((module, index) => (
              <ReleaseModuleCard
                key={`${module.label}-${index}`}
                module={module}
              />
            ))}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}

function ReleaseModuleCard({ module }: { module: ReleaseModule }) {
  return (
    <article className="flex h-[127px] w-full max-w-[300px] flex-col items-start gap-6">
      <div className="flex h-[72px] flex-col items-start gap-2">
        <span className="flex h-[22px] items-center px-2.5 py-0 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap text-brand-dark-green uppercase outline outline-1 outline-dashed outline-brand-dark-green">
          {module.label}
        </span>
        <p className="h-[42px] font-mono text-[10px] leading-[1.35] font-semibold text-brand-dark-green uppercase">
          {module.body}
        </p>
      </div>

      {module.actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {module.actions.map((action) => (
            <ActionPill key={action.label} action={action} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function RoadmapOverview({ data }: { data: RoadmapCopySection['overview'] }) {
  return (
    <section
      id="roadmap-overview"
      className="mt-10 bg-brand-off-white pt-28 pb-10 md:pb-28"
    >
      <ContentWidth>
        <h2 className="text-h3-sans text-brand-dark-green">{data.heading}</h2>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[460px_460px_460px]">
          {data.cards.map((card) => (
            <RoadmapOverviewCard key={card.id} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

function RoadmapOverviewCard({ card }: { card: OverviewCard }) {
  const isAnnouncementCard = !card.title

  return (
    <article className="relative h-[420px] w-full overflow-hidden rounded-xl bg-[#2f2f2f] text-brand-off-white [contain:paint] md:h-[480px] desktop:w-[460px]">
      <RoadmapCardBackground card={card} />

      {isAnnouncementCard ? (
        <p className="absolute top-1/2 left-1/2 w-[min(336px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 text-center font-sans text-[18px] leading-[1.15] text-brand-off-white">
          {card.body[0]}
        </p>
      ) : (
        <div className="absolute top-[60px] right-2.5 bottom-[60px] left-2.5 flex flex-col items-center justify-between">
          <h3 className="text-center font-sans text-[24px] leading-[1.1] text-brand-off-white">
            {card.title}
          </h3>
          <div className="flex w-[min(336px,calc(100%-24px))] flex-col gap-4 text-center font-sans text-[18px] leading-[1.15] text-brand-off-white">
            {card.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {card.cta ? <ActionPill action={card.cta} /> : <span />}
        </div>
      )}
    </article>
  )
}

function RoadmapCardBackground({ card }: { card: OverviewCard }) {
  switch (card.id) {
    case 'logosCoreRuntime':
      return (
        <div className="absolute top-[-287px] left-[-130px] h-[709px] w-[720px] blur-[72px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="720px"
            className="object-cover"
          />
        </div>
      )
    case 'networking':
      return (
        <div className="absolute top-[-112px] left-[-440px] h-[704px] w-[1340px] blur-[72px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="1340px"
            className="object-cover"
          />
        </div>
      )
    case 'blockchain':
      return (
        <div className="absolute top-[-124px] left-[-120px] h-[875px] w-[700px] rotate-180 blur-[67px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="700px"
            className="object-cover"
          />
        </div>
      )
    case 'messaging':
      return (
        <div className="absolute top-[-143px] left-[-57px] h-[766px] w-[574px] blur-[102px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="574px"
            className="object-cover"
          />
        </div>
      )
    case 'storage':
      return (
        <div className="absolute top-[-143px] left-[-57px] h-[766px] w-[574px] blur-[62px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="574px"
            className="object-cover"
          />
        </div>
      )
    default:
      return (
        <div className="absolute top-[calc(50%+36px)] left-[-39px] h-[1867px] w-[1494px] -translate-y-1/2 blur-[20px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="1494px"
            className="object-cover"
          />
        </div>
      )
  }
}

function RoadmapFaqs({ data }: { data: RoadmapCopySection['faqs'] }) {
  return (
    <section className="relative mt-10 mb-10 bg-brand-off-white py-28 before:absolute before:top-0 before:left-0 before:h-px before:w-full before:bg-brand-dark-green/10 before:content-['']">
      <ContentWidth>
        <h2 className="text-h3-serif text-brand-dark-green [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {data.heading}
        </h2>

        <div className="mt-[43px] flex flex-col">
          {data.items.map((item, index) => (
            <div
              key={item.question}
              className={`grid gap-6 px-3 py-3 desktop:grid-cols-[704px_712px] desktop:gap-0 desktop:px-0 ${
                index % 2 === 0 ? 'bg-black/10' : 'bg-black/5'
              }`}
            >
              <h3 className="text-body-serif text-brand-dark-green">
                {item.question}
              </h3>
              <div className="text-mono-s flex max-w-[312px] flex-col gap-[13px] text-brand-dark-green desktop:ml-[200px]">
                {item.answer.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

export default function RoadmapPage({ data }: RoadmapPageProps) {
  return (
    <>
      <RoadmapHero data={data.hero} />
      <RoadmapRelease data={data.release} />
      <RoadmapOverview data={data.overview} />
      <RoadmapFaqs data={data.faqs} />
    </>
  )
}
