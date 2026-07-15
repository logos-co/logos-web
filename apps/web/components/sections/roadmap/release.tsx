'use client'

import Image from 'next/image'
import { type KeyboardEvent, useRef, useState } from 'react'

import type { RoadmapCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

import { ActionPill, ExternalTextLink } from './atoms'
import type { ReleaseModule } from './types'

interface RoadmapReleaseProps {
  data: RoadmapCopySection['release']
}

function getReleaseTabId(index: number) {
  return `roadmap-release-tab-${index}`
}

function getReleasePanelId(index: number) {
  return `roadmap-release-panel-${index}`
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
    <section className="relative mt-10 bg-brand-off-white pt-20 pb-20 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-brand-dark-green/10 after:content-[''] desktop:pt-0 desktop:pb-0">
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
                className={`flex h-[34px] w-[92px] shrink-0 cursor-pointer items-center justify-center px-2.5 py-0 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase ${
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
          className="mt-12 desktop:flex desktop:items-start desktop:gap-[145px]"
        >
          <div className="w-full max-w-[748px] shrink-0 text-brand-dark-green desktop:mt-[94px] desktop:w-[345px]">
            {activeRelease.status ? (
              <div className="flex flex-col items-start gap-3">
                <span className="rounded-md bg-brand-yellow px-1 py-0.5 font-mono text-[10px] leading-[1.35] font-semibold text-brand-dark-green uppercase">
                  Current Status
                </span>
                <p className="font-mono-body text-[10px] leading-[1.3] uppercase">
                  {activeRelease.status}
                </p>
              </div>
            ) : null}

            <div
              className={`font-mono-body text-[10px] leading-[1.3] whitespace-pre-line ${
                activeRelease.status ? 'mt-[27px]' : ''
              }`}
            >
              <p>
                {activeRelease.dateLabel}: {activeRelease.date}
              </p>
              <p>
                {activeRelease.objectiveLabel}: {activeRelease.objective}
              </p>
              {activeRelease.releaseNotes ? (
                <p className="mt-[13px]">
                  <ExternalTextLink action={activeRelease.releaseNotes} />
                </p>
              ) : null}
              {activeRelease.body.map((paragraph) => (
                <p key={paragraph} className="mt-[26px]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 md:max-desktop:grid-cols-3 lg:max-desktop:grid-cols-4 desktop:mt-0 desktop:w-[718px] desktop:flex-none desktop:grid-cols-[repeat(3,226px)] desktop:gap-x-5">
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
    <article className="relative flex h-[218px] w-full flex-col justify-between overflow-hidden rounded-xl bg-brand-dark-green p-3 text-brand-off-white">
      <h3 className="w-[148px] font-sans text-[14px] leading-[1.2]">
        {module.label}
      </h3>

      <div className="absolute top-3 right-3 h-12 w-[42px] overflow-hidden">
        <Image
          src="/images/roadmap/release-module.webp"
          alt=""
          fill
          sizes="42px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="flex flex-col gap-6">
        <p className="font-sans text-[12px] leading-[1.2] font-medium text-brand-off-white/50">
          {module.body}
        </p>

        {module.actions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {module.actions.map((action) => (
              <ActionPill key={action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
