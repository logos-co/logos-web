'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function MusterReveals({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const poster = root.current?.querySelector<HTMLElement>('.muster-poster')
    if (!poster) return

    function measure() {
      poster?.toggleAttribute(
        'data-muster-pinned',
        poster.scrollHeight <= window.innerHeight
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(poster)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window)) return
    const host = root.current

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const counts = Array.from(
      host.querySelectorAll<HTMLElement>('[data-muster-count]')
    )
    const connections = host.querySelectorAll<HTMLElement>(
      '[data-muster-connections]'
    )

    function mount() {
      if (preference.matches) return () => {}
      const frames = new Set<number>()
      const controller = new AbortController()
      host.classList.add('muster-motion-enabled')

      function frame(callback: FrameRequestCallback) {
        const id = requestAnimationFrame((now) => {
          frames.delete(id)
          callback(now)
        })
        frames.add(id)
      }

      function countUp(element: HTMLElement) {
        const value = Number(element.dataset.musterCount)
        const start = performance.now() + counts.indexOf(element) * 80
        element.textContent = '0'
        function tick(now: number) {
          const progress = Math.min(1, Math.max(0, (now - start) / 720))
          element.textContent = String(
            Math.round(value * (1 - (1 - progress) ** 3))
          )
          if (progress < 1) frame(tick)
        }
        frame(tick)
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const element = entry.target as HTMLElement
            if (element.hasAttribute('data-muster-count')) countUp(element)
            else if (element.hasAttribute('data-muster-connections'))
              element.classList.add('muster-connected')
            else element.classList.add('muster-revealed')
            observer.unobserve(element)
          }
        },
        { threshold: 0.12 }
      )
      host
        .querySelectorAll(
          '[data-muster-reveal], [data-muster-count], [data-muster-connections]'
        )
        .forEach((element) => observer.observe(element))

      function skipHero() {
        host.classList.add('muster-skip-hero')
        controller.abort()
      }
      for (const event of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
        window.addEventListener(event, skipHero, {
          passive: true,
          signal: controller.signal,
        })
      }
      const timer = window.setTimeout(() => controller.abort(), 1500)

      return () => {
        observer.disconnect()
        controller.abort()
        window.clearTimeout(timer)
        frames.forEach(cancelAnimationFrame)
        host.classList.remove('muster-motion-enabled', 'muster-skip-hero')
        counts.forEach((element) => {
          element.textContent = element.dataset.musterCount ?? ''
        })
        connections.forEach((element) =>
          element.classList.remove('muster-connected')
        )
      }
    }

    let dispose = mount()
    function onPreferenceChange() {
      dispose()
      dispose = mount()
    }
    preference.addEventListener('change', onPreferenceChange)
    return () => {
      dispose()
      preference.removeEventListener('change', onPreferenceChange)
    }
  }, [])

  return (
    <article className="muster" ref={root}>
      {children}
    </article>
  )
}
