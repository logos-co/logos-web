import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

import { FieldLabel } from './field-label'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label?: React.ReactNode
  error?: boolean
}

export function TextareaInput({ label, error, id, ...props }: Props) {
  return (
    <div className="w-full">
      {label ? (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      ) : null}
      <textarea
        id={id}
        className={cn(
          'min-h-[120px] w-full resize-y rounded border border-brand-dark-green/30 bg-white px-3 py-2.5 font-sans text-[16px] leading-[1.3] text-brand-dark-green outline-none transition-colors placeholder:text-brand-dark-green/50 focus:border-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-red-600'
        )}
        {...props}
      />
    </div>
  )
}
