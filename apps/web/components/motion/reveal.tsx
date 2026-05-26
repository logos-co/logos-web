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
import type { Variants } from 'motion/react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import {
  DURATION,
  EASE,
  fadeUp,
  stagger as staggerVariants,
  VIEWPORT_ONCE,
} from '@/lib/motion'

type RevealProps = ComponentPropsWithoutRef<typeof motion.div> & {
  children: ReactNode
  /** When true, this component becomes a stagger container — children must be <Reveal.Item>. */
  stagger?: boolean
  /** Custom viewport amount (0–1). Default 0.3. */
  amount?: number
  /** Optional delay for the reveal transition, in seconds. */
  delay?: number
  /** Optional IntersectionObserver root margin for later or earlier trigger points. */
  viewportMargin?: string
}

export function Reveal({
  children,
  stagger = false,
  amount,
  delay,
  viewportMargin,
  ...rest
}: RevealProps) {
  const delayedFadeUp: Variants | undefined =
    delay === undefined
      ? undefined
      : {
          hidden: { opacity: 0, y: 12 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: DURATION.base,
              ease: EASE.out,
              delay,
            },
          },
        }
  const delayedStagger: Variants | undefined =
    delay === undefined
      ? undefined
      : {
          ...staggerVariants,
          visible: {
            ...((staggerVariants.visible as Record<string, unknown>) ?? {}),
            transition: {
              ...((((staggerVariants.visible as Record<string, unknown>)?.transition as Record<
                string,
                unknown
              >) ?? {})),
              delayChildren: delay,
            },
          },
        }
  const variants = stagger
    ? delay === undefined
      ? staggerVariants
      : delayedStagger
    : delay === undefined
      ? fadeUp
      : delayedFadeUp
  const viewport =
    amount !== undefined || viewportMargin !== undefined
      ? {
          ...VIEWPORT_ONCE,
          ...(amount !== undefined ? { amount } : {}),
          ...(viewportMargin !== undefined ? { margin: viewportMargin } : {}),
        }
      : VIEWPORT_ONCE

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
