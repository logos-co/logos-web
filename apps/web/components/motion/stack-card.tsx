import type { CSSProperties, ReactNode } from 'react'

interface StackCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Element id for in-page anchors. */
  id?: string
}

export function StackCard({ children, className, style, id }: StackCardProps) {
  return (
    <section id={id} className={className} style={style}>
      {children}
    </section>
  )
}
