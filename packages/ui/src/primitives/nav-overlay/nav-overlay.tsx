'use client'

import { Children, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { LogosMark } from '../../icons/logos-mark'
import { XIcon } from '../../icons/x-icon'
import { ButtonArrowIcon } from '../button/button'
import type { LinkLikeComponent } from '../button/button'

export type NavOverlayLink = {
  label: string
  href: string
}

export type NavOverlayCommunityCard = {
  label: string
  description: string
  href: string
  ctaLabel?: string
  image?: ReactNode
}

export type NavOverlayPressItem = {
  date: string
  headline: string
  href: string
  image?: ReactNode
}

export type NavOverlayLabels = {
  logo?: string
  closeMenu?: string
  sitemap?: string
  community?: string
  press?: string
  seeAll?: string
}

export type NavOverlaySection = {
  label: string
  links: NavOverlayLink[]
}

export type NavOverlayCardSection = {
  label: string
  cards: NavOverlayCommunityCard[]
}

export type NavOverlayMenuPanel = {
  label: string
  textSections?: NavOverlaySection[]
  cardSections?: NavOverlayCardSection[]
  actionCards?: NavOverlayCommunityCard[]
}

export type NavOverlayProps = {
  isOpen: boolean
  onClose: () => void
  logo?: ReactNode
  logoHref?: string
  sitemap: NavOverlayLink[]
  topLinks?: NavOverlayLink[]
  primaryCta?: NavOverlayLink
  resources?: NavOverlaySection
  community?: NavOverlayCommunityCard[]
  exploreSections?: NavOverlayCardSection[]
  menuPanels?: NavOverlayMenuPanel[]
  press?: NavOverlayPressItem[]
  pressSeeAllHref?: string
  labels?: NavOverlayLabels
  linkAs?: LinkLikeComponent
  className?: string
}

function LambdaGlyph({ size = 14 }: { size?: number }) {
  return <LogosMark size={size} className="shrink-0" />
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  const rotation = direction === 'left' ? 'rotate-135' : '-rotate-45'
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-[21px] shrink-0 border-r-2 border-b-2 border-current ${rotation}`}
    />
  )
}

function OverlayHeader({
  logo,
  logoHref,
  logoLabel,
  closeMenu,
  onClose,
  linkAs: LinkAs,
}: {
  logo?: ReactNode
  logoHref: string
  logoLabel: string
  closeMenu: string
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  return (
    <div className="sticky top-0 z-20 h-10 shrink-0 overflow-hidden bg-brand-dark-green md:h-[42px]">
      <LinkAs
        href={logoHref}
        onClick={onClose}
        className="absolute top-[12px] left-3 inline-flex cursor-pointer items-center gap-1 font-display text-[12px] leading-[1.1] text-brand-off-white transition-opacity hover:opacity-70 md:top-1.5"
      >
        {logo ?? (
          <>
            <LambdaGlyph size={11} />
            <span>{logoLabel}</span>
          </>
        )}
      </LinkAs>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation menu"
        className="text-eyebrow absolute top-[14px] left-[62.5%] inline-flex -translate-x-1/2 cursor-pointer items-center gap-1 font-semibold text-brand-off-white uppercase transition-opacity hover:opacity-70 md:left-[calc(41.67%+7px)] md:translate-x-0"
      >
        {closeMenu}
        <XIcon size={15} />
      </button>
    </div>
  )
}

function TextLinkSection({
  section,
  onClose,
  linkAs: LinkAs,
}: {
  section: NavOverlaySection
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  return (
    <nav aria-label={section.label} className="flex w-full flex-col gap-3">
      <p className="text-eyebrow font-semibold text-brand-off-white">
        {section.label}
      </p>
      <div className="h-px w-full bg-brand-off-white/10" />
      <ul className="flex flex-col gap-1">
        {section.links.map((link) => (
          <li key={link.href + link.label}>
            <LinkAs
              href={link.href}
              onClick={onClose}
              className="block cursor-pointer font-display text-[24px] leading-[1.1] text-brand-off-white transition-opacity hover:opacity-60"
            >
              {link.label}
            </LinkAs>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ActionCard({
  label,
  description,
  href,
  ctaLabel,
  image,
  onClose,
  linkAs: LinkAs,
}: NavOverlayCommunityCard & {
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  const imageNodes = Children.toArray(image)

  return (
    <LinkAs
      href={href}
      onClick={onClose}
      className="group relative flex h-[132px] w-full cursor-pointer overflow-hidden rounded-3xl bg-brand-off-white/10 p-[18px] text-brand-off-white transition-opacity hover:opacity-85 md:h-auto md:flex-1"
    >
      {imageNodes.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden *:size-full *:object-cover">
          {imageNodes}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      <div className="relative z-10 flex w-full flex-col justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <LambdaGlyph />
          <span className="font-display text-[18px] leading-[1.1]">
            {label}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className="max-w-[326px] font-sans text-[12px] font-medium leading-[1.2]">
            {description}
          </p>
          {ctaLabel && (
            <span className="text-eyebrow hidden shrink-0 items-center gap-1 font-semibold uppercase md:inline-flex">
              {ctaLabel}
              <ButtonArrowIcon />
            </span>
          )}
        </div>
      </div>
    </LinkAs>
  )
}

function MenuCard({
  label,
  description,
  href,
  image,
  onClose,
  linkAs: LinkAs,
}: NavOverlayCommunityCard & {
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  const imageNodes = Children.toArray(image)

  return (
    <LinkAs
      href={href}
      onClick={onClose}
      className="relative flex h-[117px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl bg-brand-off-white/10 p-3 text-brand-off-white transition-opacity hover:opacity-80 md:h-[170px] md:min-w-0 md:flex-1"
    >
      <p className="w-[148px] font-sans text-[14px] leading-[1.2]">{label}</p>
      <p className="font-sans text-[12px] font-medium leading-[1.2] text-brand-off-white/50">
        {description}
      </p>
      {imageNodes.length > 0 && (
        <div className="absolute top-3 right-3 h-12 w-[42px] overflow-hidden *:size-full *:object-cover">
          {imageNodes}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
    </LinkAs>
  )
}

function CardSection({
  section,
  onClose,
  linkAs,
}: {
  section: NavOverlayCardSection
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  return (
    <section
      aria-labelledby={`nav-overlay-${section.label}`}
      className="flex w-full flex-col gap-3"
    >
      <p
        id={`nav-overlay-${section.label}`}
        className="text-eyebrow font-semibold text-brand-off-white"
      >
        {section.label}
      </p>
      <div className="h-px w-full bg-brand-off-white/10" />
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {section.cards.map((card) => (
          <MenuCard
            key={card.href + card.label}
            {...card}
            onClose={onClose}
            linkAs={linkAs}
          />
        ))}
      </div>
    </section>
  )
}

function DesktopPanel({
  panel,
  onClose,
  linkAs,
}: {
  panel: NavOverlayMenuPanel
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  const firstTextSection = panel.textSections?.[0]
  const remainingTextSections = panel.textSections?.slice(1) ?? []

  return (
    <div className="hidden flex-1 gap-3 px-3 pt-3 pb-8 md:flex">
      <div className="flex flex-1 flex-col gap-10 py-3">
        {firstTextSection && (
          <TextLinkSection
            section={firstTextSection}
            onClose={onClose}
            linkAs={linkAs}
          />
        )}
        {remainingTextSections.map((section) => (
          <TextLinkSection
            key={section.label}
            section={section}
            onClose={onClose}
            linkAs={linkAs}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-10 py-3">
        {panel.actionCards && panel.actionCards.length > 0 && (
          <section
            aria-labelledby="nav-overlay-action"
            className="flex flex-1 flex-col gap-3"
          >
            <p
              id="nav-overlay-action"
              className="text-eyebrow font-semibold text-brand-off-white"
            >
              {panel.label}
            </p>
            <div className="h-px w-full bg-brand-off-white/10" />
            <div className="flex min-h-[551px] flex-1 flex-col gap-3">
              {panel.actionCards.map((card) => (
                <ActionCard
                  key={card.href + card.label}
                  {...card}
                  onClose={onClose}
                  linkAs={linkAs}
                />
              ))}
            </div>
          </section>
        )}

        {panel.cardSections?.map((section) => (
          <CardSection
            key={section.label}
            section={section}
            onClose={onClose}
            linkAs={linkAs}
          />
        ))}
      </div>
    </div>
  )
}

function MobileRoot({
  panels,
  primaryCta,
  setSelectedPanel,
  onClose,
  linkAs: LinkAs,
}: {
  panels: NavOverlayMenuPanel[]
  primaryCta?: NavOverlayLink
  setSelectedPanel: (label: string) => void
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  return (
    <div className="flex flex-1 items-center px-3 pb-3 md:hidden">
      <div className="flex flex-col items-start">
        {panels.map((panel) => (
          <button
            key={panel.label}
            type="button"
            onClick={() => setSelectedPanel(panel.label)}
            className="flex cursor-pointer items-center gap-1.5 py-3 font-display text-[40px] leading-none text-brand-off-white"
          >
            {panel.label}
            <Chevron direction="right" />
          </button>
        ))}
        {primaryCta && (
          <LinkAs
            href={primaryCta.href}
            onClick={onClose}
            className="cursor-pointer py-3 font-display text-[40px] leading-none text-brand-off-white"
          >
            {primaryCta.label}
          </LinkAs>
        )}
      </div>
    </div>
  )
}

function MobilePanel({
  panel,
  clearSelectedPanel,
  onClose,
  linkAs,
}: {
  panel: NavOverlayMenuPanel
  clearSelectedPanel: () => void
  onClose: () => void
  linkAs: LinkLikeComponent
}) {
  return (
    <div className="flex flex-1 flex-col gap-10 px-3 pt-10 pb-12 md:hidden">
      <button
        type="button"
        onClick={clearSelectedPanel}
        className="flex w-fit cursor-pointer items-center gap-1.5 py-3 font-display text-[40px] leading-none text-brand-off-white"
      >
        <Chevron direction="left" />
        {panel.label}
      </button>

      {panel.actionCards && panel.actionCards.length > 0 && (
        <section className="flex w-full flex-col gap-3">
          <p className="text-eyebrow font-semibold text-brand-off-white">
            {panel.label}
          </p>
          <div className="h-px w-full bg-brand-off-white/10" />
          <div className="flex flex-col gap-3">
            {panel.actionCards.map((card) => (
              <ActionCard
                key={card.href + card.label}
                {...card}
                onClose={onClose}
                linkAs={linkAs}
              />
            ))}
          </div>
        </section>
      )}

      {panel.cardSections?.map((section) => (
        <CardSection
          key={section.label}
          section={section}
          onClose={onClose}
          linkAs={linkAs}
        />
      ))}

      {panel.textSections?.map((section) => (
        <TextLinkSection
          key={section.label}
          section={section}
          onClose={onClose}
          linkAs={linkAs}
        />
      ))}
    </div>
  )
}

export function NavOverlay({
  isOpen,
  onClose,
  logo,
  logoHref = '/',
  sitemap,
  topLinks,
  primaryCta,
  resources,
  community,
  exploreSections,
  menuPanels,
  labels,
  linkAs,
  className,
}: NavOverlayProps) {
  const LinkAs: LinkLikeComponent = linkAs ?? 'a'
  const {
    logo: logoLabel = 'Logos',
    closeMenu = 'CLOSE MENU',
    sitemap: sitemapLabel = 'SITEMAP',
    community: communityLabel = 'TAKE ACTION',
  } = labels ?? {}

  const fallbackPanels = useMemo<NavOverlayMenuPanel[]>(() => {
    const resourceSection = resources ?? { label: sitemapLabel, links: sitemap }
    return [
      {
        label: communityLabel,
        textSections: [resourceSection],
        actionCards: community ?? [],
      },
      {
        label: topLinks?.[1]?.label ?? 'Explore',
        textSections: [resourceSection],
        cardSections: exploreSections ?? [],
      },
    ]
  }, [
    community,
    communityLabel,
    exploreSections,
    resources,
    sitemap,
    sitemapLabel,
    topLinks,
  ])

  const panels =
    menuPanels && menuPanels.length > 0 ? menuPanels : fallbackPanels
  const [selectedPanelLabel, setSelectedPanelLabel] = useState(
    panels[0]?.label ?? ''
  )
  const [selectedMobilePanelLabel, setSelectedMobilePanelLabel] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!isOpen) return
    setSelectedPanelLabel(panels[0]?.label ?? '')
    setSelectedMobilePanelLabel(null)
  }, [isOpen, panels])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedPanel =
    panels.find((panel) => panel.label === selectedPanelLabel) ?? panels[0]
  const selectedMobilePanel =
    panels.find((panel) => panel.label === selectedMobilePanelLabel) ?? null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className={`fixed inset-0 z-50 flex flex-col overflow-y-auto bg-brand-dark-green text-brand-off-white ${className ?? ''}`}
    >
      <OverlayHeader
        logo={logo}
        logoHref={logoHref}
        logoLabel={logoLabel}
        closeMenu={closeMenu}
        onClose={onClose}
        linkAs={LinkAs}
      />

      <div className="absolute top-3.5 left-[calc(50%+6px)] z-30 hidden items-start gap-6 md:flex">
        {panels.map((panel) => {
          const isActive = selectedPanel?.label === panel.label
          return (
            <button
              key={panel.label}
              type="button"
              onClick={() => setSelectedPanelLabel(panel.label)}
              className={`text-eyebrow cursor-pointer font-semibold uppercase transition-opacity hover:opacity-70 ${
                isActive
                  ? 'border-b border-brand-off-white/50 pb-0.5 text-brand-off-white'
                  : 'text-brand-off-white/50'
              }`}
            >
              {panel.label}
            </button>
          )
        })}
      </div>

      {primaryCta && (
        <LinkAs
          href={primaryCta.href}
          onClick={onClose}
          className="text-eyebrow absolute top-1.5 right-3 z-30 hidden cursor-pointer rounded-xl bg-brand-off-white px-3 py-2 font-semibold text-brand-dark-green transition-opacity hover:opacity-80 md:inline-flex"
        >
          {primaryCta.label}
        </LinkAs>
      )}

      {selectedPanel && (
        <DesktopPanel panel={selectedPanel} onClose={onClose} linkAs={LinkAs} />
      )}

      {selectedMobilePanel ? (
        <MobilePanel
          panel={selectedMobilePanel}
          clearSelectedPanel={() => setSelectedMobilePanelLabel(null)}
          onClose={onClose}
          linkAs={LinkAs}
        />
      ) : (
        <MobileRoot
          panels={panels}
          primaryCta={primaryCta}
          setSelectedPanel={setSelectedMobilePanelLabel}
          onClose={onClose}
          linkAs={LinkAs}
        />
      )}
    </div>
  )
}
