/**
 * Layout and typography primitives shared by the campaign sections.
 *
 * Colour, family and the display type scale come from `@acid-info/logos-tokens`
 * (`text-h2`, `text-h3-serif`, `text-eyebrow`, `font-display/sans/mono`,
 * `bg-brand-*`, `bg-accent-*`, `bg-gray-*`) so the page inherits palette
 * changes instead of pinning its own. The body sizes Figma uses — 20px sans,
 * 30px pull-quote, 14px eyebrow — have no equivalent utility in the token
 * package yet, so those are spelled out here; if they recur on other pages they
 * belong in `packages/tokens/src/typography.css`.
 *
 * The Figma canvas is 1440 wide with a 249px gutter and a 703px text column, so
 * the gutter only reaches full size at 1440; below that it steps down and the
 * column simply takes the space available.
 */
import type { ReactNode } from 'react'

import { TypewriterHeading } from './typewriter'

/**
 * Figma measures this page's 18 / 60 / 112px gaps cap-to-cap: every text node
 * carries `text-box-trim: trim-both` with `text-box-edge: cap alphabetic`, so
 * the half-leading above the caps and below the baseline is removed. CSS
 * measures line-box to line-box by default, which made the rhythm run ~5%
 * loose and drift ~29px over a long section.
 *
 * Applying the same trim to every text primitive lands the spacing on Figma's
 * numbers. `text-box` is Chrome 133+/Safari 18.2+; older engines ignore it and
 * fall back to the untrimmed rhythm, so this is a pure enhancement.
 */
export const TRIM = '[text-box:trim-both_cap_alphabetic]'

/**
 * Eyebrow ink, dimmed to Figma's 50% against its panel.
 *
 * Light panels dim the inherited dark-green ink; dark panels use pure white at
 * 50%, which is what Figma specifies there (not the off-white used for body
 * copy). Note this lands under WCAG AA for text this size — 3.11:1 on
 * off-white, 2.97:1 on tan, 2.25:1 on steel teal — and is kept because Figma
 * is the source of truth for the design.
 */
const EYEBROW_DIM_ON_LIGHT = 'opacity-50'
export const EYEBROW_DIM_ON_DARK = 'text-white/50'

/** Figma pairs a 20px sans quote on desktop with a 30px pull-quote size. */
const QUOTE_TYPE =
  'font-sans text-[20px] leading-[1.15] tracking-[-0.01em] md:text-[30px]'

/** Figma body copy: 20px Public Sans, 1.35 leading. */
const BODY_TYPE =
  'font-sans text-[17px] leading-[1.35] tracking-[-0.01em] md:text-[20px]'

/**
 * Renders designed line breaks: they apply from `lg` up, where the column
 * reaches its full 703px and the breaks land where the designer put them.
 * Below that the text simply flows.
 */
function DesignedLines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, index) =>
        line === '' ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="block h-[1em]"
          />
        ) : (
          <span key={`${index}-${line}`}>
            {line}
            {index < lines.length - 1 ? (
              <>
                <br className="hidden lg:inline" />
                <span className="lg:hidden"> </span>
              </>
            ) : null}
          </span>
        )
      )}
    </>
  )
}

/** Full-bleed band. `className` carries the surface colour and corner radius. */
export function Panel({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={className}>
      {/*
        Named breakpoint variants (md:, lg:) are emitted after arbitrary ones in
        this Tailwind build, so a `lg:` rule would beat `min-[1440px]:` for the
        same property. The gutter therefore uses one unbroken `min-[…]` chain.
      */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-3 py-14 min-[640px]:px-6 min-[768px]:gap-20 min-[768px]:px-10 min-[768px]:py-20 min-[1024px]:px-16 min-[1280px]:px-[120px] min-[1440px]:gap-[112px] min-[1440px]:px-[249px]">
        {children}
      </div>
    </section>
  )
}

/** The 703px reading column. Children are spaced on the Figma 60px rhythm. */
export function Column({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex w-full max-w-[703px] flex-col gap-10 md:gap-[60px] ${className}`}
    >
      {children}
    </div>
  )
}

/** Numbered eyebrow + display heading. Colour is inherited from the panel. */
export function SectionHeading({
  eyebrow,
  eyebrowClassName = EYEBROW_DIM_ON_LIGHT,
  children,
}: {
  eyebrow?: string
  /** Dark panels pass `EYEBROW_DIM_ON_DARK`; Figma dims white, not off-white. */
  eyebrowClassName?: string
  /** Typed out character by character, so it has to be a plain string. */
  children: string
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      {eyebrow ? (
        <p
          className={`font-mono-body ${TRIM} text-[12px] leading-[1.15] tracking-[-0.01em] md:text-[14px] ${eyebrowClassName}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <TypewriterHeading className={`text-h2 ${TRIM}`}>
        {children}
      </TypewriterHeading>
    </div>
  )
}

/** 20px Public Sans body copy — the page's default paragraph style. */
export function Prose({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`${BODY_TYPE} ${TRIM} ${className}`}>{children}</p>
}

/**
 * Paragraphs that sit inside a single Figma text block: separated by one blank
 * line (1.35em) rather than the column's 60px rhythm.
 */
export function ProseGroup({
  paragraphs,
  className = '',
}: {
  paragraphs: readonly string[]
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-[1.35em] ${BODY_TYPE} ${TRIM} ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
      ))}
    </div>
  )
}

/** Display-serif statement (36px in Figma). */
export function Standfirst({
  lines,
  className = '',
}: {
  lines: readonly string[]
  className?: string
}) {
  return (
    // `lg:w-max` lets a statement whose designed line is wider than the 703px
    // column sit on one line and overhang it, exactly as it does in Figma.
    // `whitespace-pre-wrap` keeps the wider sentence gap Figma sets in the
    // closing statement; HTML would otherwise collapse it to a single space.
    <p
      className={`text-h3-serif ${TRIM} whitespace-pre-wrap lg:w-max ${className}`}
    >
      <DesignedLines lines={lines} />
    </p>
  )
}

/** Large sans statement set between body paragraphs. */
export function PullQuote({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`${QUOTE_TYPE} ${TRIM} ${className}`}>{children}</p>
}

/** Light-blue quotation card plus its monospace source credit. */
export function Exhibit({
  quote,
  label,
  lines,
}: {
  quote: string
  label: string
  lines: readonly string[]
}) {
  return (
    <figure className="flex w-full flex-col gap-5">
      <blockquote className="border border-brand-dark-green bg-accent-light-blue p-6 text-brand-dark-green md:p-10">
        <PullQuote>{quote}</PullQuote>
      </blockquote>
      <figcaption
        className={`font-mono ${TRIM} text-[11px] leading-[1.15] tracking-[-0.01em] md:text-[12px]`}
      >
        <span className="block font-bold">{label}</span>
        {lines.map((line, index) => (
          <span key={`${index}-${line.slice(0, 32)}`} className="block">
            {line}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

/** Monospace note set in the dimmed eyebrow ink. */
export function DimNote({
  lines,
  className = EYEBROW_DIM_ON_DARK,
}: {
  lines: readonly string[]
  className?: string
}) {
  return (
    <p
      className={`font-mono-body ${TRIM} text-[10px] leading-[1.15] tracking-[-0.01em] ${className}`}
    >
      <DesignedLines lines={lines} />
    </p>
  )
}

/** 9x12 arrow used by the search-demand chart. Path exported from Figma. */
export function TrendArrow({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 9.5 12.5774"
      width="9.5"
      height="12.5774"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${direction === 'up' ? 'rotate-180' : ''}`}
    >
      <path
        d="M4.75 0V12M0.25 9.40192L4.75 12L9.25 9.40192"
        stroke="currentColor"
      />
    </svg>
  )
}
