/**
 * Shared presentational atoms for the Get Started page sections.
 */
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

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
