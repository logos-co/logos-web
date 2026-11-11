'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function MusterReveals({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (
      !root.current ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('muster-revealed')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12 }
    )
    root.current.querySelectorAll('[data-muster-reveal]').forEach((element) => {
      observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <article className="muster" ref={root}>
      {children}
    </article>
  )
}
