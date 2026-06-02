/**
 * Shared presentational atoms for the Get Started page sections.
 */
import type { ReactNode } from 'react'

import { Button, ButtonArrowIcon } from '@/components/ui/button'

interface SectionHeadingProps {
  number: string
  heading: string
}

interface ActionLinkProps {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
}

export function SectionHeading({ number, heading }: SectionHeadingProps) {
  return (
    <h2 className="flex items-baseline gap-3 text-[24px] leading-[1.1] tracking-[-0.24px]">
      <span className="font-display text-brand-dark-green/50">{number}</span>
      <span className="font-sans text-brand-dark-green">{heading}</span>
    </h2>
  )
}

export function ActionLink({
  children,
  href,
  variant = 'secondary',
  className,
}: ActionLinkProps) {
  const isExternal = href.startsWith('http')

  if (!isExternal) {
    return (
      <Button
        href={href}
        variant={variant}
        className={`cursor-pointer ${className ?? 'w-fit'}`}
      >
        {children}
      </Button>
    )
  }

  const classes =
    variant === 'primary'
      ? 'inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand-dark-green px-3 py-2 text-brand-off-white backdrop-blur-[5px]'
      : 'inline-flex cursor-pointer items-center justify-center rounded-[4px] border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green backdrop-blur-[5px]'

  return (
    <a
      className={`${classes} ${className ?? 'w-fit'}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
          {children}
        </span>
        <ButtonArrowIcon />
      </span>
    </a>
  )
}
