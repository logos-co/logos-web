'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'

import {
  LogosMark,
  type NavOverlayCommunityCard,
  type NavOverlayLink,
  type NavOverlayMenuPanel,
} from '@acid-info/logos-ui'
import { NavOverlay } from '@acid-info/logos-ui/client'

import { IconMask } from '@/components/icons/icon-mask'
import { ROUTES } from '@/constants/routes'
import { Link, usePathname } from '@/i18n/navigation'

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
}

function HamburgerIcon() {
  return <IconMask src="/icons/hamburger-menu.svg" className="size-[15px]" />
}

function LambdaGlyph({ className }: { className?: string }) {
  return <LogosMark size={14} className={clsx('shrink-0', className)} />
}

function BrandLockup({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const formattedLabel =
    label.length > 0
      ? `${label.charAt(0)}${label.slice(1).toLowerCase()}`
      : label

  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <LambdaGlyph />
      <span>{formattedLabel}</span>
    </span>
  )
}

export default function SiteHeaderClient({
  closedBar,
  sitemap,
  community,
  menuPanels,
  primaryCta,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasPassedHero, setHasPassedHero] = useState(false)
  const pathname = usePathname()
  const normalizedPathname = pathname.replace(/\/$/, '') || ROUTES.home

  const usesHeroHeaderTone =
    normalizedPathname === ROUTES.home ||
    normalizedPathname.endsWith(ROUTES.book) ||
    normalizedPathname.endsWith(ROUTES.about) ||
    normalizedPathname.endsWith(ROUTES.lambdaPrize)
  const usesTransparentHeader = normalizedPathname.endsWith(ROUTES.press)
  const usesOverlayHeader = usesHeroHeaderTone || usesTransparentHeader
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

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

  return (
    <>
      {/* Closed nav bar. Hero pages keep the overlay treatment; regular pages
          reserve the 40px nav height so content starts below the bar. */}
      <header
        className={clsx(
          'left-0 right-0 top-0 z-50',
          usesOverlayHeader ? 'fixed' : 'sticky'
        )}
      >
        <div
          className={clsx(
            'grid h-10 grid-cols-3 items-center px-3 transition-colors duration-300 min-[640px]:hidden',
            headerToneClass
          )}
        >
          <a
            href={ROUTES.home}
            className="-mx-3 inline-flex min-h-10 w-fit cursor-pointer items-center px-3 font-serif text-[18px] leading-none tracking-normal normal-case transition-opacity hover:opacity-70"
          >
            <BrandLockup label={closedBar.brandLabel} />
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center justify-center gap-10 min-[640px]:flex"
          >
            {menuPanels.map((panel) => (
              <button
                key={panel.label}
                type="button"
                onClick={open}
                className="text-eyebrow cursor-pointer tracking-[0.08em] whitespace-nowrap uppercase transition-opacity hover:opacity-70"
              >
                {panel.label}
              </button>
            ))}
          </nav>

          <div className="flex justify-center min-[640px]:hidden">
            <button
              type="button"
              onClick={open}
              aria-expanded={isOpen}
              aria-label={closedBar.openAriaLabel}
              className="text-eyebrow -mx-3 inline-flex min-h-10 cursor-pointer items-center gap-1.5 px-3 tracking-[0.08em] transition-opacity hover:opacity-70"
            >
              {closedBar.menuLabel} <HamburgerIcon />
            </button>
          </div>

          <div className="flex justify-end">
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="text-eyebrow hidden min-h-7 cursor-pointer items-center rounded-2xl bg-brand-dark-green px-4 uppercase text-brand-off-white transition-opacity hover:opacity-85 min-[640px]:inline-flex"
              >
                {primaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div
          className={clsx(
            'hidden h-[42px] items-baseline justify-between px-3 py-1.5 transition-colors duration-300 min-[640px]:flex',
            headerToneClass
          )}
        >
          <div className="flex items-baseline gap-3">
            <a
              href={ROUTES.home}
              className="text-eyebrow inline-flex h-[15px] w-[calc(50vw-18px)] cursor-pointer items-baseline tracking-[0.08em] transition-opacity hover:opacity-70"
            >
              <BrandLockup label={closedBar.brandLabel} />
            </a>

            <nav aria-label="Primary" className="flex items-start gap-6">
              {menuPanels.map((panel) => (
                <button
                  key={panel.label}
                  type="button"
                  onClick={open}
                  className="text-eyebrow cursor-pointer tracking-[0.08em] whitespace-nowrap uppercase transition-opacity hover:opacity-70"
                >
                  {panel.label}
                </button>
              ))}
            </nav>
          </div>

          {primaryCta ? (
            <Link
              href={primaryCta.href}
              className={clsx(
                'text-eyebrow inline-flex min-h-7 cursor-pointer items-center rounded-xl px-3 uppercase transition-opacity hover:opacity-85',
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
