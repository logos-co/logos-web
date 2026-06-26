'use client'

import clsx from 'clsx'
import { type ReactNode, useEffect, useState } from 'react'

import type { FieldGuideSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Link, useRouter } from '@/i18n/navigation'

interface PagerLink {
  href: string
  title: string
}

interface FieldGuideShellProps {
  sections: FieldGuideSection[]
  currentSlug: string
  /** Page-reference label parts, e.g. `07 · The Four Checks`. */
  pageRef: { num: string; title: string }
  prev: PagerLink | null
  next: PagerLink | null
  children: ReactNode
}

const slugToHref = (slug: string): string =>
  slug === 'index' ? '/field-guide' : `/field-guide/${slug}`

/**
 * The Field Guide reading layout: a chapter sidebar, the chapter body, and a
 * prev/next pager. Ported from the reference guide's chrome but stripped to the
 * site's light theme (no theme toggle / GitHub / print). The global site header
 * still wraps the page.
 */
export function FieldGuideShell({
  sections,
  currentSlug,
  pageRef,
  prev,
  next,
  children,
}: FieldGuideShellProps) {
  const router = useRouter()
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
    <ContentWidth className="py-8 xl:py-12">
      {/* Mobile chapter bar */}
      <div className="flex items-center gap-3 xl:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="text-eyebrow inline-flex items-center gap-2 rounded-xl bg-gray-01 px-3 py-2 text-brand-dark-green"
          aria-label="Open chapter list"
        >
          <span aria-hidden="true">☰</span> Chapters
        </button>
        <span className="text-mono-s text-brand-dark-green/70">
          {pageRef.num} · {pageRef.title}
        </span>
      </div>

      <div className="flex flex-col items-start gap-3 xl:flex-row xl:gap-24">
        {/* Sidebar — backdrop + slide-in on mobile, static column on desktop */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close chapter list"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-brand-dark-green/30 xl:hidden"
          />
        )}
        <nav
          aria-label="Field Guide chapters"
          className={clsx(
            'flex w-72 shrink-0 flex-col gap-6 self-start bg-brand-off-white',
            'max-xl:fixed max-xl:inset-y-0 max-xl:left-0 max-xl:z-50 max-xl:overflow-y-auto max-xl:p-6 max-xl:shadow-xl max-xl:transition-transform',
            isSidebarOpen ? 'max-xl:translate-x-0' : 'max-xl:-translate-x-full',
            'xl:sticky xl:top-12 xl:w-56.5 xl:py-4'
          )}
        >
          {sections.map((section) => (
            <div key={section.section} className="flex flex-col gap-2">
              <p className="text-eyebrow text-brand-dark-green/50">
                {section.section}
              </p>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = item.slug === currentSlug
                  return (
                    <li key={item.slug}>
                      <Link
                        href={slugToHref(item.slug)}
                        aria-current={isActive ? 'page' : undefined}
                        className={clsx(
                          'flex items-baseline gap-2 transition-opacity hover:opacity-60',
                          isActive
                            ? 'text-eyebrow text-brand-dark-green'
                            : 'text-mono-s text-brand-dark-green/80'
                        )}
                      >
                        <span className="text-brand-dark-green/40">
                          {item.num}
                        </span>
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Main column */}
        <article className="flex w-full max-w-3xl flex-col gap-6 pb-16 xl:py-4">
          <p className="text-eyebrow hidden text-brand-dark-green/50 xl:block">
            {pageRef.num} · {pageRef.title}
          </p>

          {children}

          {/* Pager */}
          <nav
            aria-label="Chapter navigation"
            className="mt-8 flex items-stretch justify-between gap-4 border-t border-brand-dark-green/15 pt-6"
          >
            {prev ? (
              <Link
                href={prev.href}
                rel="prev"
                className="flex flex-col gap-1 text-left transition-opacity hover:opacity-60"
              >
                <span className="text-eyebrow text-brand-dark-green/50">
                  ← Previous
                </span>
                <span className="text-body-sans text-brand-dark-green">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="flex flex-col gap-1 text-left opacity-40">
                <span className="text-eyebrow text-brand-dark-green/50">←</span>
                <span className="text-body-sans text-brand-dark-green">
                  Start of guide
                </span>
              </span>
            )}
            {next ? (
              <Link
                href={next.href}
                rel="next"
                className="flex flex-col items-end gap-1 text-right transition-opacity hover:opacity-60"
              >
                <span className="text-eyebrow text-brand-dark-green/50">
                  Next →
                </span>
                <span className="text-body-sans text-brand-dark-green">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span className="flex flex-col items-end gap-1 text-right opacity-40">
                <span className="text-eyebrow text-brand-dark-green/50">→</span>
                <span className="text-body-sans text-brand-dark-green">
                  End of guide
                </span>
              </span>
            )}
          </nav>
        </article>
      </div>
    </ContentWidth>
  )
}
