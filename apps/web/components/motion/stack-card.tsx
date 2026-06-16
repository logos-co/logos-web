'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

interface StackCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Element id for in-page anchors. */
  id?: string
  /**
   * Pixels this card rises as it scrolls into view. Stacked follow-up cards
   * usually pair this with a matching negative top margin so they settle into
   * an overlap; the first animated card can use normal spacing and still keep
   * the same downward-to-resting-position reveal. `0` makes a static card.
   */
  rise?: number
  /** Mobile-specific rise value. Defaults to `rise`. */
  mobileRise?: number
}

/**
 * Wrapper for the three "stacking" homepage sections (Civil Society → Decide →
 * Use Cases). Each animated card starts translated downward and rises to its
 * authored layout position as it scrolls into view. Later cards can combine the
 * motion with negative top margin to create the stacked overlap.
 */
export function StackCard({
  children,
  className,
  style,
  id,
  rise = 0,
  mobileRise,
}: StackCardProps) {
  const ref = useRef<HTMLElement>(null)
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches
  )
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  })
  const activeRise = isDesktop ? rise : (mobileRise ?? rise)
  // Start lower on the page, then settle at the authored layout position.
  const y = useTransform(scrollYProgress, [0, 1], [activeRise, 0])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const updateIsDesktop = () => setIsDesktop(mediaQuery.matches)

    updateIsDesktop()
    mediaQuery.addEventListener('change', updateIsDesktop)

    return () => mediaQuery.removeEventListener('change', updateIsDesktop)
  }, [])

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      style={activeRise ? { ...style, y } : style}
    >
      {children}
    </motion.section>
  )
}
