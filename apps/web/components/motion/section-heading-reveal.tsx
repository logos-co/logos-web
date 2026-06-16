'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ElementType, ReactNode } from 'react'

import { EASE } from '@/lib/motion'

interface SectionHeadingRevealProps {
  as?: ElementType
  children: ReactNode
  className?: string
  style?: CSSProperties
  delay?: number
}

export function SectionHeadingReveal({
  as = 'h2',
  children,
  className,
  style,
  delay = 0,
}: SectionHeadingRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const MotionTag = motion.create(as)

  if (shouldReduceMotion) {
    return (
      <MotionTag className={className} style={style}>
        {children}
      </MotionTag>
    )
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.45, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1, ease: EASE.out, delay }}
    >
      {children}
    </MotionTag>
  )
}
