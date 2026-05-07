/**
 * Tailwind breakpoint constants exposed to JavaScript.
 *
 * Tailwind's default breakpoints live in CSS land — but a handful of
 * imperative places (scroll-position math, pre-paint window measurements)
 * need them as numbers. Importing from this module keeps both sides aligned:
 * if Tailwind config changes, edit one place.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  /** Figma canvas reference width — wider than `2xl`, used in max-w caps. */
  figma: 1440,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

/** Convenience predicate matching Tailwind's `min-width` modifier semantics. */
export function isAtLeast(width: number, breakpoint: BreakpointKey): boolean {
  return width >= BREAKPOINTS[breakpoint]
}
