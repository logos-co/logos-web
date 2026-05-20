/**
 * Generic scroll-reveal wrapper. Fades + translates its children up when the
 * element scrolls into view (once). Supports optional staggering of children
 * by passing `stagger`.
 *
 *   <Reveal>
 *     <p>Single block — fades up on scroll.</p>
 *   </Reveal>
 *
 *   <Reveal stagger>
 *     <RevealItem>Card 1</RevealItem>
 *     <RevealItem>Card 2</RevealItem>
 *   </Reveal>
 */
'use client'

import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { fadeUp, stagger as staggerVariants, VIEWPORT_ONCE } from '@/lib/motion'

type RevealProps = ComponentPropsWithoutRef<typeof motion.div> & {
  children: ReactNode
  /** When true, this component becomes a stagger container — children must be <Reveal.Item>. */
  stagger?: boolean
  /** Custom viewport amount (0–1). Default 0.3. */
  amount?: number
}

export function Reveal({
  children,
  stagger = false,
  amount,
  ...rest
}: RevealProps) {
  const variants = stagger ? staggerVariants : fadeUp
  const viewport =
    amount !== undefined ? { ...VIEWPORT_ONCE, amount } : VIEWPORT_ONCE

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof motion.div>) {
  return (
    <motion.div variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  )
}
