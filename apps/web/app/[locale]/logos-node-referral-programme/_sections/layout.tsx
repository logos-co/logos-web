import type { ReactNode } from 'react'

interface ProgrammeWidthProps {
  children: ReactNode
  className?: string
}

export function ProgrammeWidth({
  children,
  className = '',
}: ProgrammeWidthProps) {
  return <div className={`w-full px-3 ${className}`}>{children}</div>
}
