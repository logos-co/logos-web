'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { useRef } from 'react'

interface StackCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Element id for in-page anchors. */
  id?: string
  /**
   * Pixels this card visibly rises onto the card above it as it scrolls into
   * view. The card's className must pull it up with a matching `-mt-[Npx]`
   * overlap so the rise lands inside the upper card's empty bottom padding —
   * never over its content. `0` (default) makes a static base card.
   */
  rise?: number
}

/**
 * Wrapper for the three "stacking" homepage sections (Civil Society → Decide →
 * Use Cases). Civil Society is the static base; Decide and Use Cases each rise
 * onto the card above as you scroll, scroll-linked so the upward stacking
 * motion is clearly visible. The rise only ever laps onto the upper card's
 * empty bottom padding, so content is never covered.
 */
export function StackCard({
  children,
  className,
  style,
  id,
  rise = 0,
}: StackCardProps) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  })
  // Start flush (y = +rise cancels the negative overlap margin), then rise to
  // its resting overlap (y = 0) as the card scrolls toward the viewport centre.
  const y = useTransform(scrollYProgress, [0, 1], [rise, 0])

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      style={rise ? { ...style, y } : style}
    >
      {children}
    </motion.section>
  )
}
