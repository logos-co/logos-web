import type { ReactNode } from 'react'

import ContentWidth from '@/components/layout/content-width'

const DEFAULT_CLASS_NAMES = {
  root: 'relative h-[800px] overflow-hidden bg-brand-dark-green px-3 pt-10 text-brand-off-white',
  content: 'relative z-10 flex h-full items-center justify-center',
  column: 'flex w-full -translate-y-[6px] flex-col items-center text-center',
}

interface CampaignHeroProps {
  /** Absolutely positioned layers behind the copy: image, overlay. */
  background: ReactNode
  /** The centred copy column. */
  children: ReactNode
  /** Rendered after the column, e.g. a row of in-page links. */
  footer?: ReactNode
  /** Each slot replaces the default classes outright. */
  classNames?: Partial<typeof DEFAULT_CLASS_NAMES>
}

/**
 * The 800px full-bleed campaign hero first built for /lambda-prize: a photo
 * background under the fixed site header with a centred copy column.
 */
export function CampaignHero({
  background,
  children,
  footer,
  classNames,
}: CampaignHeroProps) {
  const slots = { ...DEFAULT_CLASS_NAMES, ...classNames }

  return (
    <section className={slots.root}>
      {background}
      <ContentWidth className={slots.content}>
        <div className={slots.column}>{children}</div>
        {footer}
      </ContentWidth>
    </section>
  )
}
