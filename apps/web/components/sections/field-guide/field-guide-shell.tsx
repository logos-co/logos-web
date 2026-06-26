'use client'

import clsx from 'clsx'
import { type ReactNode, useEffect, useState } from 'react'

import type { FieldGuideSection } from '@repo/content/schemas'

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import { Link, useRouter } from '@/i18n/navigation'

import { useFieldGuideTheme } from './field-guide-theme'

interface PagerLink {
  href: string
  title: string
}

interface FieldGuideShellProps {
  guideTitle: string
  version: string
  sections: FieldGuideSection[]
  currentSlug: string
  /** Header reference label, e.g. `07 · The Four Checks`. */
  pageRef: string
  prev: PagerLink | null
  next: PagerLink | null
  /** Eyebrow above the chapter title, e.g. `Foundations · 07`. */
  eyebrow: string
  children: ReactNode
}

const slugToHref = (slug: string): string =>
  slug === 'index' ? ROUTES.fieldGuide : ROUTES.fieldGuideChapter(slug)

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.35 4.7-4.58 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M6 14h12v7H6z" />
    </svg>
  )
}

/**
 * Self-contained Field Guide reading shell, ported from the reference site to
 * match its layout, typography, chrome, and Paper/Ink theme. Renders its own
 * header (λ brand, page reference, theme toggle, GitHub, print), chapter
 * sidebar, and prev/next pager. The site-wide header/footer are hidden for
 * these routes. Theme is stored independently under `fg-theme`.
 */
export function FieldGuideShell({
  guideTitle,
  version,
  sections,
  currentSlug,
  pageRef,
  prev,
  next,
  eyebrow,
  children,
}: FieldGuideShellProps) {
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useFieldGuideTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Close the mobile sidebar whenever the chapter changes.
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [currentSlug])

  // ←/→ navigate chapters; Esc closes the mobile sidebar. Ignored while a form
  // control is focused so typing isn't hijacked.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
        return
      }
      if (event.key === 'ArrowLeft' && prev) router.push(prev.href)
      if (event.key === 'ArrowRight' && next) router.push(next.href)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [prev, next, router])

  return (
    <div className="fg-shell" data-theme={theme}>
      <header className="fg-top">
        <div className="fg-top__brand">
          <button
            type="button"
            className="fg-top__menu fg-icon-btn"
            aria-label="Open chapter list"
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <span className="bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <Link
            href={ROUTES.home}
            className="fg-top__home"
            aria-label="Logos home"
          >
            <span className="fg-top__lambda" aria-hidden="true">
              λ
            </span>
            <span className="fg-top__title">{guideTitle}</span>
          </Link>
        </div>
        <div className="fg-top__bar">
          <span className="fg-top__pageref">{pageRef}</span>
          <span className="fg-top__spacer" />
          <button
            type="button"
            className="fg-icon-btn"
            aria-label={theme === 'dark' ? 'Switch to Paper' : 'Switch to Ink'}
            onClick={toggleTheme}
          >
            <SunIcon />
          </button>
          <a
            className="fg-icon-btn"
            href={EXTERNAL_URLS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <GithubIcon />
          </a>
          <button
            type="button"
            className="fg-icon-btn"
            aria-label="Print"
            onClick={() => window.print()}
          >
            <PrintIcon />
          </button>
        </div>
      </header>

      <nav
        className={clsx('fg-sidebar', isSidebarOpen && 'is-open')}
        aria-label="Chapters"
      >
        {sections.map((section) => (
          <div key={section.section} className="fg-sidebar__section">
            <p className="fg-sidebar__h">{section.section}</p>
            <ul className="fg-sidebar__list">
              {section.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    className="fg-sidebar__item"
                    href={slugToHref(item.slug)}
                    aria-current={
                      item.slug === currentSlug ? 'page' : undefined
                    }
                  >
                    <span className="fg-sidebar__num">{item.num}</span>
                    <span className="fg-sidebar__title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        aria-label="Close chapter list"
        className={clsx(
          'fg-sidebar-backdrop',
          isSidebarOpen && 'is-visible'
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <main className="fg-main">
        <article className="fg-article">
          <p className="fg-eyebrow">{eyebrow}</p>

          {children}

          <nav className="fg-pager" aria-label="Chapter navigation">
            {prev ? (
              <Link className="fg-pager__link is-prev" href={prev.href} rel="prev">
                <span className="fg-pager__label">← Previous</span>
                <span className="fg-pager__title">{prev.title}</span>
              </Link>
            ) : (
              <span className="fg-pager__link is-prev" aria-disabled="true">
                <span className="fg-pager__label">←</span>
                <span className="fg-pager__title">Start of guide</span>
              </span>
            )}
            {next ? (
              <Link className="fg-pager__link is-next" href={next.href} rel="next">
                <span className="fg-pager__label">Next →</span>
                <span className="fg-pager__title">{next.title}</span>
              </Link>
            ) : (
              <span className="fg-pager__link is-next" aria-disabled="true">
                <span className="fg-pager__label">→</span>
                <span className="fg-pager__title">End of guide</span>
              </span>
            )}
          </nav>

          <footer className="fg-footer">
            <span>{guideTitle}</span>
            <span>{version}</span>
          </footer>
        </article>
      </main>
    </div>
  )
}
