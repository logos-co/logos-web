/**
 * Word-by-word fade-up heading. Used for hero headlines where each word
 * should animate in individually.
 *
 *   <AnimatedHeading className="text-hero">
 *     Pioneering a New Era of Freedom
 *   </AnimatedHeading>
 */
'use client'

import { motion } from 'motion/react'
import type { CSSProperties, ElementType } from 'react'

import { heroFadeUp, wordStagger } from '@/lib/motion'

type Props = {
  children: string
  className?: string
  style?: CSSProperties
  /** HTML tag to render. Defaults to h1. */
  as?: ElementType
  /** Delay before the stagger begins (seconds). */
  delay?: number
}

export function AnimatedHeading({
  children,
  className,
  style,
  as = 'h1',
  delay = 0,
}: Props) {
  const MotionTag = motion.create(as)
  const words = children.split(' ')

  return (
    <MotionTag
      className={className}
      style={style}
      variants={wordStagger}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay + 0.2 }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-[0.08em] align-bottom"
        >
          <motion.span variants={heroFadeUp} className="inline-block">
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  )
}
