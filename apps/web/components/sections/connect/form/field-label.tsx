import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Props = {
  htmlFor?: string
  children: ReactNode
  required?: boolean
  className?: string
}

export function FieldLabel({ htmlFor, children, required, className }: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'mb-1.5 block font-mono text-[10px] leading-[1.3] text-brand-dark-green',
        className
      )}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  )
}
