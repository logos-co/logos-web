import type { ReactNode } from 'react'

/** The H3 Sans section title the Figma frame uses above most blocks. */
export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2 className={`text-h3-sans text-brand-dark-green ${className ?? ''}`}>
      {children}
    </h2>
  )
}
