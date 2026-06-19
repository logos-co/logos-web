'use client'

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Click-and-drag horizontal scrolling for mouse users, with momentum (inertia)
 * after release for a smooth feel. Trackpads and touch devices already scroll
 * horizontally with native momentum, so those pointer types are left untouched
 * — only mouse drags are hijacked. This unblocks Windows/desktop-mouse users
 * who otherwise can't reach off-screen cards in our scrollbar-less carousels.
 *
 * Handlers read `event.currentTarget`, so `useDragScroll` can be spread onto any
 * scroll element — including motion components that forward props but not refs.
 */
const DRAG_THRESHOLD_PX = 5
// Per-frame velocity decay (~60fps); lower = quicker stop.
const FRICTION = 0.92
// Below this px/frame the momentum animation stops.
const MIN_VELOCITY_PX = 0.4

interface DragState {
  el: HTMLElement | null
  isDown: boolean
  moved: boolean
  startX: number
  startScrollLeft: number
  lastX: number
  velocity: number
  raf: number
}

export interface DragScrollHandlers {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void
  onClickCapture: (event: React.MouseEvent<HTMLElement>) => void
  onDragStart: (event: React.DragEvent<HTMLElement>) => void
}

export function useDragScroll(): DragScrollHandlers {
  const state = useRef<DragState>({
    el: null,
    isDown: false,
    moved: false,
    startX: 0,
    startScrollLeft: 0,
    lastX: 0,
    velocity: 0,
    raf: 0,
  })

  const stopMomentum = useCallback(() => {
    if (state.current.raf) {
      cancelAnimationFrame(state.current.raf)
      state.current.raf = 0
    }
  }, [])

  // CSS scroll-snap (snap-mandatory) fights frame-by-frame scrollLeft writes and
  // makes the drag/glide stutter. Suspend it while dragging, restore afterwards
  // so the carousel still settles onto a card.
  const restoreSnap = useCallback(() => {
    if (state.current.el) state.current.el.style.scrollSnapType = ''
  }, [])

  // Cancel any in-flight animation frame if the component unmounts mid-glide.
  useEffect(() => stopMomentum, [stopMomentum])

  const startMomentum = useCallback(() => {
    const s = state.current
    const el = s.el
    if (!el) return
    const step = () => {
      if (Math.abs(s.velocity) < MIN_VELOCITY_PX) {
        s.raf = 0
        restoreSnap()
        return
      }
      el.scrollLeft -= s.velocity
      s.velocity *= FRICTION
      s.raf = requestAnimationFrame(step)
    }
    s.raf = requestAnimationFrame(step)
  }, [restoreSnap])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Let touch/pen keep native momentum scrolling; only mouse needs help.
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      const el = event.currentTarget
      // Nothing to drag on non-overflowing layouts (e.g. desktop grids) —
      // bailing keeps card clicks from being swallowed by the drag guard.
      if (el.scrollWidth <= el.clientWidth) return
      // Cancel the browser's native link/image drag so pressing on a card image
      // or anchor still starts a scroll drag. Works on any container, including
      // motion components that swallow a React onDragStart handler. A plain
      // click still fires (preventDefault on pointerdown doesn't cancel click).
      event.preventDefault()
      stopMomentum()
      const s = state.current
      s.el = el
      s.isDown = true
      s.moved = false
      s.startX = event.clientX
      s.lastX = event.clientX
      s.startScrollLeft = el.scrollLeft
      s.velocity = 0
    },
    [stopMomentum]
  )

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const s = state.current
    if (!s.isDown || !s.el) return
    const dx = event.clientX - s.startX
    if (!s.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return
    if (!s.moved) {
      s.moved = true
      s.el.setPointerCapture(event.pointerId)
      s.el.style.cursor = 'pointer'
      s.el.style.userSelect = 'none'
      s.el.style.scrollSnapType = 'none'
    }
    s.velocity = event.clientX - s.lastX
    s.lastX = event.clientX
    s.el.scrollLeft = s.startScrollLeft - dx
  }, [])

  const endDrag = useCallback(() => {
    const s = state.current
    if (!s.isDown) return
    s.isDown = false
    if (s.el) {
      s.el.style.cursor = ''
      s.el.style.userSelect = ''
    }
    if (s.moved && Math.abs(s.velocity) >= MIN_VELOCITY_PX) {
      startMomentum()
    } else {
      restoreSnap()
    }
  }, [restoreSnap, startMomentum])

  // Suppress the click that fires after a drag so cards/links don't activate.
  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!state.current.moved) return
    event.preventDefault()
    event.stopPropagation()
    state.current.moved = false
  }, [])

  // Stop the browser's native image/text ghost-drag while dragging to scroll.
  const onDragStart = useCallback((event: React.DragEvent<HTMLElement>) => {
    if (state.current.isDown) event.preventDefault()
  }, [])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
    onDragStart,
  }
}

interface DragScrollProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  id?: string
}

/** Convenience wrapper that applies {@link useDragScroll} to a plain `div`. */
export function DragScroll({ children, className, style, id }: DragScrollProps) {
  const handlers = useDragScroll()
  return (
    <div className={className} style={style} id={id} {...handlers}>
      {children}
    </div>
  )
}
