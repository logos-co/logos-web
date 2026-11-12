'use client'

import { useEffect, useRef } from 'react'
import type { MusterCopySection } from '@repo/content/schemas'

interface DemoVideoProps {
  video: MusterCopySection['intro']['video']
}

export function DemoVideo({ video }: DemoVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let centred = false
    const updatePlayback = () => {
      if (!centred || reducedMotion.matches || document.hidden) {
        element.pause()
      } else {
        void element.play().catch(() => {})
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        centred = entry.isIntersecting
        updatePlayback()
      },
      { rootMargin: '-35% 0px -35% 0px' }
    )
    observer.observe(element)
    reducedMotion.addEventListener('change', updatePlayback)
    document.addEventListener('visibilitychange', updatePlayback)
    return () => {
      observer.disconnect()
      reducedMotion.removeEventListener('change', updatePlayback)
      document.removeEventListener('visibilitychange', updatePlayback)
      element.pause()
    }
  }, [])

  return (
    <video
      ref={ref}
      className="muster-video"
      src={video.src}
      poster={video.poster}
      width={video.width}
      height={video.height}
      aria-label={video.alt}
      controls
      muted
      playsInline
      preload="none"
    />
  )
}
