/**
 * Shared presentational atoms for the press page sections (articles + podcasts).
 * All exports are private to the `/press` route.
 */
import Image from 'next/image'
import type { ReactNode } from 'react'

import { ExternalLink } from '@/components/ui'
import { cn } from '@/lib/cn'

export function ArrowIcon({
  direction = 'right',
}: {
  direction?: 'down' | 'right'
}) {
  const maskStyle = {
    mask: 'url(/icons/right-arrow.svg) center / contain no-repeat',
    WebkitMask: 'url(/icons/right-arrow.svg) center / contain no-repeat',
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-[15px] shrink-0 bg-current',
        direction === 'down' ? 'rotate-90' : ''
      )}
      style={maskStyle}
    />
  )
}

export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-[3px] rounded-full bg-brand-dark-green', className)}
    />
  )
}

export function TextLink({
  children,
  href,
  label,
  tone = 'dark',
  className,
}: {
  children: ReactNode
  href: string
  label?: string
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <ExternalLink
      href={href}
      aria-label={label}
      className={cn(
        'cursor-pointer font-mono text-[10px] font-semibold leading-[1.35] uppercase underline underline-offset-[3px] transition-opacity hover:opacity-70',
        tone === 'light'
          ? 'text-brand-off-white decoration-brand-off-white/50'
          : 'text-brand-dark-green decoration-brand-dark-green/50',
        className
      )}
    >
      {children}
    </ExternalLink>
  )
}

export function UnderlineLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green underline decoration-brand-dark-green/50 underline-offset-[3px]">
      {children}
    </span>
  )
}

export function PlayIcon({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex size-[30px] shrink-0 items-center justify-center rounded-full border',
        inverted ? 'border-brand-off-white' : 'border-brand-dark-green'
      )}
    >
      <span
        className={cn(
          'ml-[2px] h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent',
          inverted ? 'border-l-brand-off-white' : 'border-l-brand-dark-green'
        )}
      />
    </span>
  )
}

function getAlternatingRowBackground(index: number) {
  return index % 2 === 1 ? 'bg-brand-off-white/10' : 'bg-brand-dark-green/10'
}

export function PressRowLink({
  href,
  index,
  className,
  children,
}: {
  href: string
  index: number
  className?: string
  children: ReactNode
}) {
  return (
    <ExternalLink
      href={href}
      className={cn(
        'group relative block cursor-pointer overflow-hidden text-brand-dark-green transition-colors duration-200 hover:bg-brand-yellow focus-visible:bg-brand-yellow',
        getAlternatingRowBackground(index),
        className
      )}
    >
      {children}
    </ExternalLink>
  )
}

export function RowThumbnail({
  src,
  className,
}: {
  src: string
  className?: string
}) {
  return (
    <div className={cn('absolute aspect-video overflow-hidden', className)}>
      <Image
        src={src}
        alt=""
        width={107}
        height={60}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

export function SectionCta({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <div className="flex h-24 items-center justify-center px-3 pb-3">
      <ExternalLink
        href={href}
        className="flex h-[84px] w-full cursor-pointer items-center justify-center rounded-xl border border-brand-dark-green text-brand-dark-green transition-colors hover:bg-brand-yellow"
      >
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          {label}
          <ArrowIcon />
        </span>
      </ExternalLink>
    </div>
  )
}
