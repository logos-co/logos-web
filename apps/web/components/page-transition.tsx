'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { usePathname } from '@/i18n/navigation'

type Props = {
  children: ReactNode
}

const PAGE_TRANSITION_EASE = [0.65, 0, 0.35, 1] as const
const COVER_IN_MS = 560

export default function PageTransition({ children }: Props) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  const [isCovered, setIsCovered] = useState(false)
  const isNavigatingRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // Always cancel any pending navigation timer so browser history controls
    // during the cover-in window do not get hijacked 560 ms later.
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!isNavigatingRef.current) return

    window.requestAnimationFrame(() => {
      isNavigatingRef.current = false
      setIsCovered(false)
    })
  }, [pathname])

  // Browser back/forward into this page needs care: internal links navigate
  // with a full document load (window.location.assign) while the cover overlay
  // is showing, so the page is frequently snapshotted mid-transition
  // (isCovered === true).
  //
  // - popstate (same-document history, e.g. in-page hash links): just clear the
  //   cover so the overlay does not stay stuck.
  // - pageshow with persisted === true (bfcache restore): React effects do NOT
  //   re-run, so client state across the whole page (this cover, the nav
  //   overlay, the home scroll-stack animation) stays frozen and the page can
  //   appear dead/non-interactive. Forcing a full reload puts the page back on
  //   the normal fresh-load path, which restores all interactivity reliably.
  useEffect(() => {
    const reset = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      isNavigatingRef.current = false
      setIsCovered(false)
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload()
      }
    }

    window.addEventListener('popstate', reset)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('popstate', reset)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  useEffect(() => {
    const shouldIgnoreClick = (
      event: MouseEvent,
      anchor: HTMLAnchorElement
    ) => {
      if (event.defaultPrevented) return true
      if (event.button !== 0) return true
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return true
      }
      if (anchor.target && anchor.target !== '_self') return true
      if (anchor.hasAttribute('download')) return true

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      if (nextUrl.origin !== currentUrl.origin) return true
      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return true
      }

      return false
    }

    // Same-page hash links (e.g. "#map") drive their own smooth scroll instead
    // of relying on native hash navigation. Native behavior is unreliable here:
    // re-clicking the hash already in the URL is a no-op, so once one in-page
    // CTA has set "#map", the others appear to "jump" or do nothing. Scrolling
    // the target into view ourselves makes every in-page CTA behave identically.
    const handleSamePageHash = (
      event: MouseEvent,
      anchor: HTMLAnchorElement
    ) => {
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      if (anchor.target && anchor.target !== '_self') return

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const isSamePage =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      if (!isSamePage || !nextUrl.hash) return

      const targetEl = document.getElementById(
        decodeURIComponent(nextUrl.hash.slice(1))
      )
      if (!targetEl) return

      event.preventDefault()
      targetEl.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      })
      if (nextUrl.hash !== currentUrl.hash) {
        window.history.pushState(null, '', nextUrl.hash)
      }
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (shouldIgnoreClick(event, anchor)) {
        handleSamePageHash(event, anchor)
        return
      }

      event.preventDefault()
      const nextUrl = new URL(anchor.href, window.location.href)
      const navigate = () => {
        window.location.assign(
          `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
        )
      }

      if (shouldReduceMotion) {
        navigate()
        return
      }

      window.dispatchEvent(new CustomEvent('logos:navigation-start'))
      isNavigatingRef.current = true
      setIsCovered(true)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(navigate, COVER_IN_MS)
    }

    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [shouldReduceMotion])

  return (
    <>
      {children}
      <motion.div
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-brand-off-white ${
          isCovered ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        initial={false}
        animate={{ opacity: isCovered ? 1 : 0 }}
        transition={{
          opacity: {
            duration: isCovered ? COVER_IN_MS / 1000 : 0.72,
            ease: PAGE_TRANSITION_EASE,
          },
        }}
        style={{ willChange: 'opacity' }}
      />
    </>
  )
}
