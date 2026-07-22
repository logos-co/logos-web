/**
 * @figma-path   Card hover / Tech stack / Tech stack item
 * @figma-node   40009046:27669 (frame) · 40009046:27670 (default) · 40009046:27671 (hover)
 * @figma-source internal-copy
 * @figma-ref    see docs/figma-trace.yaml
 *
 * Default state: transparent bg, dark-green border, centered Lambda icon + title.
 * Hover state:   light-blue bg (no border); top-left thumbnail, top-right CTA,
 *                centered Lambda icon + title + description, optional bottom extras.
 *
 * The primitive is layout-agnostic — height, image, description, ctaHref
 * and children are all opt-in props controlled by the consumer.
 */
import type { ReactNode } from 'react'

import type { LinkLikeComponent } from '../button/button'

function LambdaGlyph() {
  return (
    <span
      aria-hidden="true"
      className="font-display text-[18px] leading-none italic text-brand-dark-green"
    >
      Lambda icon
    </span>
  )
}

type CardProps = {
  /** Title shown next to the Lambda icon glyph. */
  title: ReactNode
  /** Supporting body copy (only rendered when provided). */
  description?: ReactNode
  /** Top-left thumbnail (only rendered when provided). */
  image?: ReactNode
  /** CTA label (default: "Learn more"). */
  ctaLabel?: string
  /** CTA href. Only renders a top-right CTA when provided. */
  ctaHref?: string
  /** Override the CTA anchor element (e.g. pass next-intl's `Link`). Defaults to `'a'`. */
  linkAs?: LinkLikeComponent
  /** Show the Lambda icon glyph next to the title. Figma omits it on NS / FK cards. */
  showIcon?: boolean
  /** Pin the card in its hover state (for docs / parity with Figma "Hover" frame). */
  forceHover?: boolean
  /** Lock the card in its default state — disables hover reveal and bg change. */
  staticDefault?: boolean
  /** Fixed height (e.g. 366, "366px"). When omitted, the card sizes to its content. */
  height?: number | string
  /** Extra content rendered at the bottom (e.g. Blockchain info boxes). */
  children?: ReactNode
  className?: string
}

export function Card({
  title,
  description,
  image,
  ctaLabel = 'Learn more',
  ctaHref,
  linkAs,
  showIcon = true,
  forceHover = false,
  staticDefault = false,
  height,
  children,
  className,
}: CardProps) {
  // Default / static cards still get the light-blue hover background — only
  // the inner reveal (image / description / children) is suppressed when
  // staticDefault is set.
  const bgClass = forceHover
    ? 'bg-accent-light-blue'
    : 'bg-transparent hover:bg-accent-light-blue'
  const borderClass = forceHover
    ? 'border border-transparent'
    : 'border border-brand-dark-green hover:border-transparent'
  const revealClass = forceHover
    ? 'opacity-100'
    : staticDefault
      ? 'opacity-0'
      : 'opacity-0 group-hover/card:opacity-100'

  const style = height
    ? { height: typeof height === 'number' ? `${height}px` : height }
    : undefined

  // CTA only renders when the consumer provides an href or when the card is
  // pinned in hover state. Static default cards never render the CTA.
  const showCta = !staticDefault && (!!ctaHref || forceHover)

  const cursorClass = forceHover ? 'cursor-pointer' : 'hover:cursor-pointer'

  return (
    <div
      className={`group/card relative flex flex-col items-center rounded-3xl px-1.5 pt-3 pb-1.5 transition-colors duration-200 ${borderClass} ${bgClass} ${cursorClass} ${className ?? ''}`}
      style={style}
    >
      {image && (
        <span
          className={`pointer-events-none absolute top-3 left-3 z-10 block h-[57px] w-[46px] overflow-hidden transition-opacity duration-200 ${revealClass}`}
        >
          <span className="absolute inset-0 [&>*]:size-full [&>*]:object-cover">
            {image}
          </span>
        </span>
      )}

      {showCta && <CardCTA label={ctaLabel} href={ctaHref} linkAs={linkAs} />}

      {/* Centered header block */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-3 py-1">
        <div className="flex items-center gap-2.5">
          {showIcon && <LambdaGlyph />}
          <p className="text-center font-sans text-[18px] leading-[1.15] tracking-[-0.01em] text-brand-dark-green">
            {title}
          </p>
        </div>
        {description && (
          <p
            className={`max-w-[222px] text-center font-mono text-xs leading-[1.3] text-brand-dark-green transition-opacity duration-200 ${revealClass}`}
          >
            {description}
          </p>
        )}
      </div>

      {/* Bottom extras */}
      {children && (
        <div
          className={`flex w-full flex-col gap-1.5 transition-opacity duration-200 ${revealClass}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function CardCTA({
  label,
  href,
  linkAs: LinkAs = 'a',
}: {
  label: string
  href?: string
  linkAs?: LinkLikeComponent
}) {
  const className =
    'absolute top-3 right-3 z-10 inline-flex items-center rounded-xl bg-brand-dark-green px-3 py-2 backdrop-blur-[5px]'
  const content = (
    <span className="font-mono text-xs leading-[1.35] font-semibold text-brand-off-white uppercase">
      {label}
    </span>
  )
  return href ? (
    <LinkAs href={href} className={className}>
      {content}
    </LinkAs>
  ) : (
    <span className={className}>{content}</span>
  )
}

/**
 * Inner info block used inside a Card (e.g. Blockchain's LEZ / Cryptarchia).
 * Content is anchored at the bottom-left when a fixed height is provided, so
 * long descriptions overflow upward and stay pinned to the bottom edge.
 */
export function CardInfo({
  label,
  description,
  height,
}: {
  label: string
  description: string
  /** Fixed height (e.g. 78, "78px"). Omit to size to content. */
  height?: number | string
}) {
  const style = height
    ? { height: typeof height === 'number' ? `${height}px` : height }
    : undefined
  const isFixed = !!height

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-brand-dark-green/50 ${isFixed ? '' : 'px-2.75 pt-1.5 pb-2.75'}`}
      style={style}
    >
      <div
        className={
          isFixed
            ? 'absolute right-2.75 bottom-2.75 left-2.75 flex flex-col gap-0.5 pt-1.5'
            : 'flex flex-col gap-0.5'
        }
      >
        <p className="font-mono text-xs leading-[1.3] font-medium text-brand-dark-green uppercase">
          {label}
        </p>
        <p className="font-mono text-xs leading-[1.3] text-brand-dark-green">
          {description}
        </p>
      </div>
    </div>
  )
}
