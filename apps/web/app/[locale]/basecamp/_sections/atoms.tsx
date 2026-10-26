import type { ReactNode } from 'react'
import type { BasecampRenewalSection } from '@repo/content/schemas'

export type Renewal = BasecampRenewalSection
export const asset = '/images/basecamp/renewal'

export function Lines({
  lines,
  className = '',
}: {
  lines: string[]
  className?: string
}) {
  return (
    <span className={className}>
      {lines.map((line, index) => (
        <span className="bc-line" key={index}>
          {line}
        </span>
      ))}
    </span>
  )
}

export function LinkButton({
  href,
  children,
  className = '',
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      className={`bc-button cursor-pointer ${className}`}
      href={href}
      target={href.startsWith('https://') ? '_blank' : undefined}
      rel={href.startsWith('https://') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  )
}
