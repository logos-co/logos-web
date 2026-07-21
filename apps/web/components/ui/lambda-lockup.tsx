/**
 * λ + title lockup, built to the brand-guide construction drawing
 * ("Logos Designs" → Secondary Logo Construction).
 *
 * Measured off that drawing, relative to the title's cap height:
 *
 *   mark height           1.1516 × cap
 *   rises above cap line  0.0643 × cap
 *   hangs below baseline  0.0873 × cap   (the overshoot is bottom-heavy)
 *   gap between elements  2 × the capital's vertical stem width
 *
 * Rhymes Display has a cap height of 0.73em and a 0.101em capital stem, so the
 * constants below are folded into fractions of the *title's font size* and
 * derived with calc() from `--lockup-font-size`. Callers set that variable —
 * per breakpoint where the title is responsive — to whatever the title renders
 * at, e.g. `[--lockup-font-size:30px] md:[--lockup-font-size:36px]`.
 *
 * `items-baseline` seats the mark's bottom edge exactly on the text baseline,
 * and the LogosMark path fills its viewBox, so the downward nudge is precisely
 * the bottom overshoot.
 */
import { LogosMark } from '@acid-info/logos-ui'
import clsx from 'clsx'
import type { ReactNode } from 'react'

/** Mark height ÷ font size — 1.1516 cap × 0.73em cap height. */
const MARK_HEIGHT = 0.8407
/** Downward nudge ÷ font size — 0.0873 cap × 0.73em cap height. */
const BASELINE_DROP = 0.0637
/** LogosMark viewBox is 20×26. */
const MARK_ASPECT = 20 / 26
/**
 * Gap ÷ font size. The ink gap is 2 × 0.101em; the mark's viewBox leaves 4.41%
 * of its width empty on the right and the leading capital carries ~0.03em of
 * side bearing, so the css gap is the ink gap less both.
 */
const GAP = 0.202 - 0.0441 * MARK_HEIGHT * MARK_ASPECT - 0.03

const fromFontSize = (fraction: number) =>
  `calc(var(--lockup-font-size) * ${fraction})`

interface LambdaLockupProps {
  /** The title. Set `--lockup-font-size` on `className` to match its size. */
  children: ReactNode
  className?: string
  /** Applied to the mark — use for colour, e.g. `text-gray-03`. */
  markClassName?: string
}

export function LambdaLockup({
  children,
  className,
  markClassName,
}: LambdaLockupProps) {
  return (
    <div
      className={clsx('inline-flex items-baseline', className)}
      style={{ gap: fromFontSize(GAP) }}
    >
      <LogosMark
        height={fromFontSize(MARK_HEIGHT)}
        width={fromFontSize(MARK_HEIGHT * MARK_ASPECT)}
        className={clsx('shrink-0', markClassName)}
        style={{ transform: `translateY(${fromFontSize(BASELINE_DROP)})` }}
      />
      {children}
    </div>
  )
}
