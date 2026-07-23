'use client'

import { LogosMark } from '@acid-info/logos-ui'
import Image from 'next/image'
import { type KeyboardEvent, useRef, useState } from 'react'

import type { RoadmapCopySection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

import { ExternalTextLink } from './atoms'
import type { ReleaseModule, RoadmapAction } from './types'

interface RoadmapReleaseProps {
  data: RoadmapCopySection['release']
}

function getReleaseTabId(index: number) {
  return `roadmap-release-tab-${index}`
}

function getReleasePanelId(index: number) {
  return `roadmap-release-panel-${index}`
}

function isExternalHref(href: string) {
  return href.startsWith('https://')
}

export function RoadmapRelease({ data }: RoadmapReleaseProps) {
  const [activeTab, setActiveTab] = useState(data.activeTab)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeRelease =
    data.items.find((item) => item.tab === activeTab) ?? data.items[0]!
  const activeReleaseIndex = Math.max(
    0,
    data.items.findIndex((item) => item.tab === activeRelease.tab)
  )

  const activateTabAtIndex = (index: number) => {
    const item = data.items[index]

    if (!item) {
      return
    }

    setActiveTab(item.tab)
    tabRefs.current[index]?.focus()
  }

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const lastIndex = data.items.length - 1

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      activateTabAtIndex(index === lastIndex ? 0 : index + 1)
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      activateTabAtIndex(index === 0 ? lastIndex : index - 1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      activateTabAtIndex(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      activateTabAtIndex(lastIndex)
    }
  }

  return (
    <section className="relative mt-10 bg-brand-off-white pb-[100px]">
      <ContentWidth>
        <div
          aria-label={data.tabsAriaLabel}
          role="tablist"
          className="flex h-[34px] w-fit max-w-full divide-x divide-brand-dark-green overflow-x-auto outline outline-1 outline-brand-dark-green [outline-offset:-1px]"
        >
          {data.items.map((item, index) => {
            const isActive = item.tab === activeRelease.tab
            const tabId = getReleaseTabId(index)
            const panelId = getReleasePanelId(index)

            return (
              <button
                key={item.tab}
                id={tabId}
                ref={(node) => {
                  tabRefs.current[index] = node
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                className={`flex h-[34px] w-[92px] shrink-0 cursor-pointer items-center justify-center px-2.5 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase ${
                  isActive
                    ? 'bg-brand-dark-green text-brand-off-white'
                    : 'text-brand-dark-green'
                }`}
                onClick={() => setActiveTab(item.tab)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {item.tab}
              </button>
            )
          })}
        </div>

        <div
          id={getReleasePanelId(activeReleaseIndex)}
          role="tabpanel"
          aria-labelledby={getReleaseTabId(activeReleaseIndex)}
          tabIndex={0}
          className="mt-10 flex flex-col gap-10 min-[1025px]:mt-[18px] min-[1025px]:grid min-[1025px]:grid-cols-2 min-[1025px]:gap-3 desktop:h-[696px]"
        >
          <div className="contents min-[1025px]:flex min-[1025px]:flex-col min-[1025px]:gap-[34px] min-[1025px]:pt-[41px]">
            <ReleaseInformation release={activeRelease} />
            <ReleaseModuleTable modules={activeRelease.modules} />
          </div>

          <ReleaseFeature feature={data.feature} />
        </div>
      </ContentWidth>
    </section>
  )
}

function ReleaseInformation({
  release,
}: {
  release: RoadmapCopySection['release']['items'][number]
}) {
  return (
    <div className="order-1 w-full text-brand-dark-green min-[1025px]:max-w-full min-[1025px]:w-[548px]">
      {release.status ? (
        <span className="inline-flex rounded-sm bg-brand-yellow px-1 py-0.5 font-mono text-[10px] leading-[1.35] font-semibold uppercase">
          {release.status}
        </span>
      ) : null}

      <div
        className={`font-mono-body text-[10px] leading-[1.3] ${
          release.status ? 'mt-[27px]' : ''
        }`}
      >
        <p>
          {release.dateLabel}: {release.date}
        </p>
        <p>
          {release.objectiveLabel}: {release.objective}
        </p>
        {release.releaseNotes ? (
          <p className="mt-[13px]">
            <ExternalTextLink action={release.releaseNotes} />
          </p>
        ) : null}
        {release.body.map((paragraph) => (
          <p key={paragraph} className="mt-[26px]">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

function ReleaseModuleTable({ modules }: { modules: ReleaseModule[] }) {
  return (
    <div className="order-3 overflow-hidden md:grid md:grid-cols-[121px_minmax(0,1fr)_auto] min-[1025px]:order-2 min-[1025px]:w-full">
      {modules.map((module, index) => (
        <ReleaseModuleRow
          key={`${module.label}-${index}`}
          module={module}
          index={index}
        />
      ))}
    </div>
  )
}

function ReleaseModuleRow({
  module,
  index,
}: {
  module: ReleaseModule
  index: number
}) {
  return (
    <article
      className={`grid min-h-[50px] grid-cols-[minmax(96px,121px)_minmax(0,1fr)] gap-x-3 px-3 py-3 text-brand-dark-green md:col-span-3 md:grid-cols-subgrid md:px-0 ${
        index % 2 === 0 ? 'bg-[#dbddd7]' : 'bg-brand-dark-green/5'
      }`}
    >
      <h3 className="font-display text-[14px] leading-[1.2] md:pl-3">
        {module.label}
      </h3>
      <p className="max-w-[368px] font-mono-body text-[10px] leading-[1.3]">
        {module.body}
      </p>
      {module.actions.length > 0 ? (
        <div className="col-start-2 mt-3 flex flex-wrap items-start gap-3 md:col-start-3 md:mt-0 md:min-w-[156px] md:pr-3">
          {module.actions.map((action, actionIndex) => (
            <ModuleActionLink
              key={`${action.label}-${actionIndex}`}
              action={action}
              showIcon={actionIndex === 0}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function ModuleActionLink({
  action,
  showIcon,
}: {
  action: RoadmapAction
  showIcon: boolean
}) {
  const className =
    'inline-flex cursor-pointer items-center gap-1 border-b border-brand-dark-green/50 pb-0.5 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap text-brand-dark-green uppercase'
  const content = (
    <>
      <span>{action.label}</span>
      {showIcon ? (
        <IconMask src="/icons/external-link.svg" className="size-[15px]" />
      ) : null}
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
        className={className}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={action.href} className={className}>
      {content}
    </Link>
  )
}

function ReleaseFeature({
  feature,
}: {
  feature: RoadmapCopySection['release']['feature']
}) {
  return (
    <div className="relative order-2 aspect-[702/521] w-full overflow-hidden rounded-xl text-brand-off-white min-[1025px]:order-none desktop:h-[521px] desktop:aspect-auto">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <Image
          src={feature.image.src}
          alt={feature.image.alt}
          width={feature.image.width}
          height={feature.image.height}
          sizes="(min-width: 1440px) 1459px, (min-width: 1025px) 104vw, 208vw"
          className="absolute top-[-18.21%] left-[-78.08%] h-[119.96%] w-[207.78%] max-w-none"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 from-[25.835%] to-transparent to-50%" />
      </div>

      <div className="absolute top-3 right-3 left-3 flex items-start justify-between">
        <div className="flex w-[142px] items-center justify-between">
          <LogosMark size={9} className="shrink-0" />
          <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
            {feature.eyebrow}
          </span>
        </div>
        <p className="w-[min(333px,48%)] font-mono-body text-[10px] leading-[1.3]">
          {feature.body}
        </p>
      </div>
    </div>
  )
}
