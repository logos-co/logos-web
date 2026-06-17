import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  className?: string
}

export function TechStackDetailPage({ children, className }: Props) {
  return (
    <div
      className={twMerge('bg-brand-off-white text-brand-dark-green', className)}
    >
      {children}
    </div>
  )
}

export function TechStackDetailSection({ children, className }: Props) {
  return (
    <div
      className={twMerge(
        'mt-15 first-of-type:mt-0 md:mt-25 md:first-of-type:mt-30',
        className
      )}
    >
      {children}
    </div>
  )
}
