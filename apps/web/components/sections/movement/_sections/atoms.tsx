/**
 * Shared presentational atoms and image map for the Movement page sections.
 */
import type { CSSProperties, ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

import type { CtaProps, CtaTone } from './types'

export const movementImages = {
  heroThumb: '/images/movement/hero-thumb.webp',
  activism: '/images/movement/action-activism.webp',
  coalition: '/images/movement/action-coalition.webp',
  building: '/images/movement/action-building.webp',
  campaign: '/images/movement/campaign-sunset.webp',
  issueLosAngeles: '/images/movement/issue-los-angeles.webp',
  issueLondon: '/images/movement/issue-london.webp',
  issuePorto: '/images/movement/issue-porto.webp',
  event: '/images/movement/event-florianopolis.webp',
  coalitionBg: '/images/movement/coalition-bg.webp',
} as const

const ctaToneClass: Record<CtaTone, string> = {
  primary: 'rounded-xl bg-brand-dark-green px-3 py-2 text-brand-off-white',
  secondary:
    'border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green',
  tertiary: 'text-brand-dark-green',
  light: 'rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green',
  link: 'text-brand-dark-green',
}

export function Cta({ href, label, tone = 'primary', className }: CtaProps) {
  const isExternal = href.startsWith('http')
  const classes = `inline-flex cursor-pointer items-center justify-center gap-1 font-mono text-[10px] font-semibold leading-[1.35] uppercase backdrop-blur-[5px] transition-opacity hover:opacity-70 ${ctaToneClass[tone]} ${className ?? ''}`
  const content = (
    <>
      <span
        className={tone === 'link' ? 'border-b border-current/50 pb-0.5' : ''}
      >
        {label}
      </span>
      <IconMask src="/icons/right-arrow.svg" className="size-[15px]" />
    </>
  )

  if (isExternal) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  )
}

export function LambdaBadge({
  size = 23,
  tone = 'dark',
  className,
  style,
}: {
  size?: number
  tone?: 'dark' | 'light' | 'yellow'
  className?: string
  style?: CSSProperties
}) {
  const toneClass =
    tone === 'yellow'
      ? 'border-brand-yellow bg-brand-yellow text-brand-dark-green'
      : tone === 'light'
        ? 'border-brand-off-white text-brand-off-white'
        : 'border-brand-dark-green text-brand-dark-green'

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border ${toneClass} ${className ?? ''}`}
      style={{ width: size, height: size, ...style }}
    >
      <LogosMark size={Math.max(4, Math.round(size * 0.4))} />
    </span>
  )
}

export function SectionHeader({
  title,
  description,
  cta,
  className,
  titleClassName,
  descriptionClassName,
}: {
  title: ReactNode
  description: string
  cta?: ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}) {
  return (
    <ContentWidth
      className={`grid grid-cols-1 gap-4 px-3 pt-10 text-brand-dark-green md:grid-cols-12 md:gap-3 ${className ?? ''}`}
    >
      <h2 className={`text-h3-serif md:col-span-5 ${titleClassName ?? ''}`}>
        {title}
      </h2>
      <p
        className={`text-mono-s max-w-[456px] md:col-span-3 md:col-start-7 ${descriptionClassName ?? ''}`}
      >
        {description}
      </p>
      {cta ? <div className="md:col-span-2 md:col-start-11">{cta}</div> : null}
    </ContentWidth>
  )
}

export function CenterCtaSection({
  title,
  body,
  cta,
  className,
}: {
  title: string
  body: string
  cta: ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-brand-off-white px-3 py-25 text-center text-brand-dark-green ${className ?? ''}`}
    >
      <div className="mx-auto flex max-w-[456px] flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-h3-serif">{title}</h2>
          <p className="text-mono-s">{body}</p>
        </div>
        {cta}
      </div>
    </section>
  )
}
