'use client'

import Image from 'next/image'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

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
    <section className="relative mt-10 bg-brand-off-white pb-0 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-black/25 before:content-[''] desktop:pb-[100px]">
      <ContentWidth>
        <div
          aria-label={data.tabsAriaLabel}
          role="tablist"
          className="flex h-[40px] w-fit max-w-full divide-x divide-brand-dark-green overflow-x-auto outline outline-1 outline-brand-dark-green [outline-offset:-1px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`flex h-[40px] w-[120px] shrink-0 cursor-pointer items-center justify-center px-4 font-mono text-xs leading-[1.35] font-semibold whitespace-nowrap uppercase ${
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
          className="mt-10 flex flex-col gap-10 min-[1025px]:mt-[18px] min-[1025px]:grid min-[1025px]:grid-cols-2 min-[1025px]:items-stretch min-[1025px]:gap-3 min-[1025px]:pt-[41px]"
        >
          {/* Every release is stacked into the same desktop grid cell, so the cell
              is always as tall as the tallest of them and the feature image keeps
              one height across all tabs instead of resizing on every switch. Only
              the active release is visible; the rest just hold the height open.
              A fixed min-height cannot do this because the tallest release changes
              with the column width. Mobile renders the active release alone. */}
          <div className="contents min-[1025px]:grid min-[1025px]:grid-cols-1">
            {data.items.map((item) => (
              <ReleaseColumn
                key={item.tab}
                release={item}
                isActive={item.tab === activeRelease.tab}
              />
            ))}
          </div>

          <ReleaseFeature image={activeRelease.image} />
        </div>
      </ContentWidth>
    </section>
  )
}

function ReleaseColumn({
  release,
  isActive,
}: {
  release: RoadmapCopySection['release']['items'][number]
  isActive: boolean
}) {
  return (
    <div
      aria-hidden={!isActive || undefined}
      className={`min-[1025px]:flex min-[1025px]:flex-col min-[1025px]:justify-between min-[1025px]:gap-[34px] min-[1025px]:[grid-area:1/1] ${
        isActive ? 'contents' : 'hidden min-[1025px]:invisible'
      }`}
    >
      <ReleaseInformation release={release} />
      <ReleaseModuleTable modules={release.modules} />
    </div>
  )
}

function ReleaseInformation({
  release,
}: {
  release: RoadmapCopySection['release']['items'][number]
}) {
  return (
    <div className="order-1 w-full text-brand-dark-green">
      {release.status ? (
        <span className="inline-flex rounded-sm bg-brand-yellow px-1 py-0.5 font-mono text-xs leading-[1.35] font-semibold uppercase">
          {release.status}
        </span>
      ) : null}

      {/* max-w-[92ch] reproduces the Figma measure exactly: the copy is monospaced,
          so a character-based cap keeps the desktop line breaks identical whichever
          fallback in the Fira Mono stack renders. It must sit on this element, the
          one that owns the mono font, because `ch` resolves against the element's
          own font. Mobile is uncapped and wraps naturally. */}
      <div
        className={`font-mono-body text-xs leading-[1.3] min-[1025px]:max-w-[92ch] ${
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
      <p className="max-w-[368px] font-mono-body text-xs leading-[1.3]">
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
    'inline-flex cursor-pointer items-center gap-1 border-b border-brand-dark-green/50 pb-0.5 font-mono text-xs leading-[1.35] font-semibold whitespace-nowrap text-brand-dark-green uppercase'
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
  image,
}: {
  image: RoadmapCopySection['release']['items'][number]['image']
}) {
  const [displayedImage, setDisplayedImage] = useState(image)

  useEffect(() => {
    if (image.src === displayedImage.src) {
      return
    }

    let isCancelled = false
    const nextImage = new window.Image()
    const showNextImage = () => {
      if (!isCancelled) {
        setDisplayedImage(image)
      }
    }

    nextImage.addEventListener('load', showNextImage, { once: true })
    nextImage.src = image.src

    if (nextImage.complete && nextImage.naturalWidth > 0) {
      showNextImage()
    }

    return () => {
      isCancelled = true
      nextImage.removeEventListener('load', showNextImage)
    }
  }, [displayedImage.src, image])

  // On desktop the image drops its fixed aspect ratio and stretches to the grid
  // row, so its bottom edge lands on the last module row: both columns end on the
  // same line. Mobile keeps the 702/521 crop since it stacks.
  return (
    <div className="relative order-2 aspect-[702/521] w-full overflow-hidden rounded-xl min-[1025px]:order-none min-[1025px]:aspect-auto min-[1025px]:h-full">
      <Image
        src={displayedImage.src}
        alt={displayedImage.alt}
        width={displayedImage.width}
        height={displayedImage.height}
        sizes="(min-width: 1025px) 50vw, 100vw"
        className="h-full w-full object-cover object-[62%_center]"
        loading="eager"
      />
    </div>
  )
}
