/**
 * Shared atoms for the per-domain `*-builder-cta.tsx` sections on the
 * technology-stack pages (blockchain / storage / networking / messaging).
 *
 * The four pages keep their own outer section + per-card shell JSX to
 * preserve Figma pixel fidelity (different responsive heights, builder-hub
 * blur recipes, and absolute layouts). Only the truly-identical pieces live
 * here: the download icon and the title/body/CTA stack used inside the
 * Docs and Logos App cards.
 */
import type { ReactNode } from 'react'

import { IconMask } from '@/components/icons/icon-mask'

/** 15px download glyph used in the Logos App card's CTA across all four pages. */
export function DownloadIcon() {
  return <IconMask src="/icons/download.svg" className="size-3.75" />
}

type Tone = 'dark' | 'light'

export type CardContentProps = {
  title: string
  body: string
  cta: ReactNode
  /** `dark` → dark-green text on light backgrounds; `light` → off-white on dark. */
  tone: Tone
  /**
   * Optional override for the outer flex-col wrapper className. Defaults to
   * the blockchain/networking spec (`gap-10`); storage uses `gap-6 md:gap-10`.
   */
  wrapperClassName?: string
}

const DEFAULT_WRAPPER_CLASSNAME =
  'flex flex-col items-center justify-center gap-10'

/**
 * Centered title + body block with a CTA below it. Used inside the
 * Docs (bordered) and Logos App (gray-01 rounded) card shells.
 */
export function CardContent({
  title,
  body,
  cta,
  tone,
  wrapperClassName = DEFAULT_WRAPPER_CLASSNAME,
}: CardContentProps) {
  const textColor =
    tone === 'dark' ? 'text-brand-dark-green' : 'text-brand-off-white'
  return (
    <div className={wrapperClassName}>
      <div
        className={`flex w-full max-w-108 flex-col items-center gap-3 px-4 text-center ${textColor}`}
      >
        <p className="text-subhead-sans w-full">{title}</p>
        <p className="text-mono-s w-full max-w-95">{body}</p>
      </div>
      {cta}
    </div>
  )
}
