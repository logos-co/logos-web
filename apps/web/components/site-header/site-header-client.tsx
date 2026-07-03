'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'

import type { HomepageHighlight } from '@repo/content/schemas'
import {
  LogosMark,
  LogosWordmark,
  type NavOverlayCommunityCard,
  type NavOverlayLink,
  type NavOverlayMenuPanel,
} from '@acid-info/logos-ui'
import { NavOverlay } from '@acid-info/logos-ui/client'

import { IconMask } from '@/components/icons/icon-mask'
import { ROUTES } from '@/constants/routes'
import { Link, usePathname } from '@/i18n/navigation'

import { HomepageHighlightCard } from './homepage-highlight-card'

type ClosedBarLabels = {
  brandLabel: string
  menuLabel: string
  closeLabel: string
  openAriaLabel: string
  closeAriaLabel: string
}

type Props = {
  closedBar: ClosedBarLabels
  sitemap: NavOverlayLink[]
  community: NavOverlayCommunityCard[]
  menuPanels: NavOverlayMenuPanel[]
  primaryCta?: NavOverlayLink
  homepageHighlight?: HomepageHighlight
}

function HamburgerIcon() {
  return <IconMask src="/icons/hamburger-menu.svg" className="size-[15px]" />
}

function LambdaGlyph({ className }: { className?: string }) {
  return <LogosMark size={11} className={clsx('shrink-0', className)} />
}

export default function SiteHeaderClient({
  closedBar,
  sitemap,
  community,
  menuPanels,
  primaryCta,
  homepageHighlight,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialPanelLabel, setInitialPanelLabel] = useState<string | null>(
    null
  )
  const [hasPassedHero, setHasPassedHero] = useState(false)
  const pathname = usePathname()
  const normalizedPathname = pathname.replace(/\/$/, '') || ROUTES.home
  const showHomepageHighlight =
    normalizedPathname === ROUTES.home && homepageHighlight?.enabled === true

  const usesHeroHeaderTone =
    normalizedPathname === ROUTES.home ||
    normalizedPathname.endsWith(ROUTES.book) ||
    normalizedPathname.endsWith(ROUTES.about) ||
    normalizedPathname.endsWith(ROUTES.lambdaPrize)
  const usesTransparentHeader = normalizedPathname.endsWith(ROUTES.media)
  const usesOverlayHeader = usesHeroHeaderTone || usesTransparentHeader
  const usesAccentTanHeaderTone =
    normalizedPathname.endsWith(ROUTES.logosBroadcastNetwork) ||
    normalizedPathname.endsWith(ROUTES.podcast)
  const open = () => {
    setInitialPanelLabel(null)
    setIsOpen(true)
  }
  const close = () => {
    setInitialPanelLabel(null)
    setIsOpen(false)
  }

  useEffect(() => {
    window.addEventListener('logos:navigation-start', close)
    return () => {
      window.removeEventListener('logos:navigation-start', close)
    }
  }, [])

  useEffect(() => {
    if (!usesHeroHeaderTone) {
      setHasPassedHero(false)
      return
    }

    const syncHeaderColor = () => {
      setHasPassedHero(window.scrollY >= window.innerHeight)
    }

    syncHeaderColor()
    window.addEventListener('scroll', syncHeaderColor, { passive: true })
    window.addEventListener('resize', syncHeaderColor)

    return () => {
      window.removeEventListener('scroll', syncHeaderColor)
      window.removeEventListener('resize', syncHeaderColor)
    }
  }, [usesHeroHeaderTone])

  const headerToneClass = usesHeroHeaderTone
    ? hasPassedHero
      ? 'text-black'
      : 'text-white'
    : 'text-brand-dark-green'

  const openPanel = (panelLabel: string) => {
    setInitialPanelLabel(panelLabel)
    setIsOpen(true)
  }

  return (
    <>
      {/* Closed nav bar. Hero pages keep the overlay treatment; regular pages
          reserve the 40px nav height so content starts below the bar. */}
      <header
        className={clsx(
          'left-0 right-0 top-0 z-50',
          usesOverlayHeader ? 'fixed' : 'sticky',
          usesAccentTanHeaderTone && 'bg-accent-tan'
        )}
      >
        <div
          className={clsx(
            'relative transition-colors duration-300 md:hidden',
            showHomepageHighlight ? 'h-[119px]' : 'h-10',
            headerToneClass
          )}
        >
          {showHomepageHighlight ? (
            <HomepageHighlightCard data={homepageHighlight} />
          ) : null}

          <a
            href={ROUTES.home}
            className={clsx(
              'absolute left-3 inline-flex cursor-pointer items-center transition-opacity hover:opacity-70',
              showHomepageHighlight
                ? 'text-eyebrow top-[99px] -translate-y-1/2 border-b border-current/50 pb-0.5 font-semibold uppercase'
                : 'top-1/2 -translate-y-1/2 gap-1'
            )}
          >
            {showHomepageHighlight ? (
              closedBar.brandLabel
            ) : (
              <>
                <span className="sr-only">{closedBar.brandLabel}</span>
                <LambdaGlyph />
                <LogosWordmark className="translate-y-[1px]" />
              </>
            )}
          </a>

          <button
            type="button"
            onClick={open}
            aria-expanded={isOpen}
            aria-label={closedBar.openAriaLabel}
            className={clsx(
              'text-eyebrow absolute left-[calc(50%+6px)] inline-flex cursor-pointer items-center gap-1.5 font-semibold transition-opacity hover:opacity-70',
              showHomepageHighlight
                ? 'top-[99px] -translate-y-1/2'
                : 'top-1/2 -translate-y-1/2'
            )}
          >
            {closedBar.menuLabel} <HamburgerIcon />
          </button>

          {showHomepageHighlight ? (
            <LambdaGlyph className="absolute top-[99px] right-3 -translate-y-1/2" />
          ) : null}
        </div>

        <div
          className={clsx(
            'relative hidden h-[42px] transition-colors duration-300 md:block',
            headerToneClass
          )}
        >
          {showHomepageHighlight ? (
            <HomepageHighlightCard data={homepageHighlight} />
          ) : null}

          <a
            href={ROUTES.home}
            className="absolute top-1/2 left-3 -translate-y-1/2 inline-flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-70"
          >
            <span className="sr-only">{closedBar.brandLabel}</span>
            <LambdaGlyph />
            <LogosWordmark className="translate-y-[1px]" />
          </a>

          <nav
            aria-label="Primary"
            className="absolute top-1/2 left-[calc(50%+6px)] -translate-y-1/2 flex items-center gap-6"
          >
            {menuPanels.map((panel) => (
              <button
                key={panel.label}
                type="button"
                onClick={() => openPanel(panel.label)}
                className="text-eyebrow font-semibold cursor-pointer whitespace-nowrap uppercase transition-opacity hover:opacity-70"
              >
                {panel.label}
              </button>
            ))}
          </nav>

          {primaryCta ? (
            <Link
              href={primaryCta.href}
              className={clsx(
                'absolute top-1/2 right-3 -translate-y-1/2 text-eyebrow font-semibold cursor-pointer items-center rounded-xl px-3 py-2.5 uppercase transition-opacity hover:opacity-85',
                'hidden lg:inline-flex',
                usesHeroHeaderTone && !hasPassedHero
                  ? 'bg-brand-off-white text-brand-dark-green'
                  : 'bg-brand-dark-green text-brand-off-white'
              )}
            >
              {primaryCta.label}
            </Link>
          ) : null}
        </div>
      </header>

      {/* Full-screen overlay — shared primitive from @acid-info/logos-ui */}
      <NavOverlay
        isOpen={isOpen}
        onClose={close}
        initialSelectedPanelLabel={initialPanelLabel ?? undefined}
        sitemap={sitemap}
        community={community}
        menuPanels={menuPanels}
        primaryCta={primaryCta}
        labels={{ closeMenu: closedBar.closeLabel }}
        linkAs={Link}
      />
    </>
  )
}
