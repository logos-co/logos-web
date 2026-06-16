'use client'

import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

import { EASE } from '@/lib/motion'

interface StackCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Element id for in-page anchors. */
  id?: string
}

/**
 * Wrapper for the three "stacking" homepage sections (Civil Society → Decide →
 * Use Cases). The card frame is statically positioned — the rounded top and the
 * negative-margin overlap are applied by the caller's className, so the overlap
 * seam between cards never shifts. Only the inner content fades up on scroll,
 * giving a calm entrance without the stack appearing to "jump".
 */
export function StackCard({ children, className, style, id }: StackCardProps) {
  return (
    <section id={id} className={className} style={style}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: EASE.out }}
      >
        {children}
      </motion.div>
    </section>
  )
}
