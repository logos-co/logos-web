'use client'

import { useEffect } from 'react'

import { mediaAnchorId, mediaFragmentId } from '@/lib/media-anchors'

interface MediaFragmentNavigationProps {
  prefix?: string
}

function findAnchor(id: string) {
  return (
    document.getElementById(id) ??
    Array.from(document.getElementsByName(id)).find(
      (element) => element instanceof HTMLAnchorElement
    )
  )
}

export function MediaFragmentNavigation({
  prefix,
}: MediaFragmentNavigationProps) {
  useEffect(() => {
    if (!prefix) return

    const findMediaAnchor = () => {
      const hash = window.location.hash
      if (!hash || hash === '#') return

      const candidates = [hash.slice(1), mediaFragmentId(hash)]
      if (candidates.some(findAnchor)) return

      return candidates
        .map((id) => findAnchor(mediaAnchorId(id, prefix)))
        .find((element) => element !== undefined)
    }
    const scrollToMediaAnchor = () => findMediaAnchor()?.scrollIntoView()

    // The browser does not dispatch hashchange when a link points to the current fragment.
    const handleRepeatClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return
      }

      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
      if (
        link?.hash === window.location.hash &&
        (!link.target || link.target === '_self') &&
        !link.hasAttribute('download')
      ) {
        const target = findMediaAnchor()
        if (target) {
          event.preventDefault()
          target.scrollIntoView()
        }
      }
    }

    const frame = requestAnimationFrame(scrollToMediaAnchor)
    window.addEventListener('hashchange', scrollToMediaAnchor)
    document.addEventListener('click', handleRepeatClick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', scrollToMediaAnchor)
      document.removeEventListener('click', handleRepeatClick)
    }
  }, [prefix])

  return null
}
