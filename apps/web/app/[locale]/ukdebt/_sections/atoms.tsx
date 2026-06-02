/**
 * Shared presentational helpers and scroll hooks for the UK Debt page sections.
 */
import { useEffect, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

import styles from '../ukdebt.module.css'

// CSS custom properties are not part of React's CSSProperties type, so style
// objects that set `--*` variables are cast to this widened type.
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>

export const asset = (name: string) => `/campaigns/ukdebt/${name}`

export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    let frame = 0

    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const start = viewport * 0.85
      const end = viewport * 0.2
      const raw = (start - rect.top) / (start - end)
      setProgress(Math.min(1, Math.max(0, raw)))
    }

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [ref])

  return progress
}

export function useActiveRowIndex<T extends HTMLElement>(
  ref: RefObject<T | null>,
  totalRows: number,
) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    let frame = 0

    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()

      if (rect.height <= 0) {
        return
      }

      const viewportCenter = (window.innerHeight || 1) / 2
      const rowHeight = rect.height / totalRows
      const offset = viewportCenter - rect.top
      const raw = Math.floor(offset / rowHeight)
      const clamped = Math.min(totalRows - 1, Math.max(0, raw))
      setIndex(clamped)
    }

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [ref, totalRows])

  return index
}

export function useTitleReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll(
        `.${styles.titleReveal}, .${styles.copyReveal}, .${styles.imageReveal}`,
      ),
    )
    const systemSection = document.querySelector(`.${styles.systemSection}`)

    if (elements.length === 0 && !systemSection) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) =>
        element.classList.add(styles.titleRevealed),
      )
      systemSection
        ?.querySelectorAll(
          `.${styles.titleReveal}, .${styles.copyReveal}, .${styles.imageReveal}`,
        )
        .forEach((element) => element.classList.add(styles.titleRevealed))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === systemSection) {
              entry.target
                .querySelectorAll(
                  `.${styles.titleReveal}, .${styles.copyReveal}, .${styles.imageReveal}`,
                )
                .forEach((element) =>
                  element.classList.add(styles.titleRevealed),
                )
            } else {
              entry.target.classList.add(styles.titleRevealed)
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px 15% 0px', threshold: 0.01 },
    )

    elements.forEach((element) => observer.observe(element))
    if (systemSection) {
      observer.observe(systemSection)
    }

    return () => observer.disconnect()
  }, [])
}
