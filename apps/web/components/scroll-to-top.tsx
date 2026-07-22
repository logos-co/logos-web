'use client'

import { useEffect, useRef } from 'react'

import { usePathname } from '@/i18n/navigation'

/**
 * Force every navigation — including browser back/forward and bfcache
 * restore — to start at the top of the page.
 *
 * Why all three handlers are needed:
 *   - The pathname effect covers normal forward navigation.
 *   - `scrollRestoration = 'manual'` stops the browser from rewinding to
 *     the previous scroll position after React renders on back/forward.
 *   - `popstate` covers the back/forward case where the pathname effect
 *     would otherwise lose a race against the browser's restore.
 *   - `pageshow` with `event.persisted === true` covers bfcache restore,
 *     during which React effects do not re-run.
 */
export default function ScrollToTop() {
  const pathname = usePathname()
  const isInitialLoad = useRef(true)

  useEffect(() => {
    const initial = isInitialLoad.current
    isInitialLoad.current = false

    if (initial && window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1))

      const scrollToTarget = () => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'instant' })
      }

      scrollToTarget()
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) scrollToTop()
    }

    window.addEventListener('popstate', scrollToTop)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('popstate', scrollToTop)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  return null
}
