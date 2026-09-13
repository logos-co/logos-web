/**
 * Shared class tokens and atoms for the PriFi page sections.
 */
import type { ReactNode } from 'react'

import { Button, type ButtonVariant } from '@/components/ui'

/**
 * Figma measures most of this page's gaps cap-to-cap: the text nodes carry
 * `text-box-trim: trim-both` with `text-box-edge: cap alphabetic`. Applying
 * the same trim lands the spacing on Figma's numbers. `text-box` is Chrome
 * 133+/Safari 18.2+; older engines fall back to the untrimmed rhythm.
 */
export const TRIM = '[text-box:trim-both_cap_alphabetic]'

/** Figma's 18px body: Public Sans, 1.2 line height, -0.36px tracking. */
export const BODY_18 = 'text-[18px] leading-[1.2] tracking-[-0.02em]'

/** Figma's 12px mono cell copy (10px in the file, raised to 12px site-wide). */
export const MONO_CELL = 'font-mono text-xs font-medium uppercase leading-[1.3]'

/**
 * A Figma CTA whose destination may not be decided yet. Without one it renders
 * as a plain button with the same look, so a click keeps the reader on the page.
 */
export function CtaButton({
  href,
  variant,
  className,
  children,
}: {
  href: string | null
  variant?: ButtonVariant
  className?: string
  children: ReactNode
}) {
  return href ? (
    <Button href={href} variant={variant} className={className}>
      {children}
    </Button>
  ) : (
    <Button variant={variant} className={className}>
      {children}
    </Button>
  )
}
