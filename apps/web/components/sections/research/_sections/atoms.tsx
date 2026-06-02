/**
 * Shared presentational atoms for the Research page sections.
 */
import type { ReactNode } from 'react'

import { ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import type { LinkItem } from './types'

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href)
}

export function TextLink({ href, children }: LinkItem & { children: ReactNode }) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer underline underline-offset-2"
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className="cursor-pointer underline underline-offset-2">
      {children}
    </Link>
  )
}

export function CtaLink({ label, href }: LinkItem) {
  const className =
    'inline-flex cursor-pointer items-center gap-1 rounded-[4px] font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green'
  const content = (
    <>
      <span>{label}</span>
      <ButtonArrowIcon />
    </>
  )

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

export function LinkButton({ label, href }: LinkItem) {
  const className =
    'inline-flex cursor-pointer items-center gap-1 border-b border-brand-dark-green/50 pb-0.5 font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green'
  const content = (
    <>
      <span>{label}</span>
      <ButtonArrowIcon />
    </>
  )

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}
