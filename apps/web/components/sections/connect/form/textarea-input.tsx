import type { TextareaHTMLAttributes } from 'react'

import { MAX_TEXT_LENGTH } from '@/lib/civicrm/contactFormSchema'
import { cn } from '@/lib/cn'

import { FieldLabel } from './field-label'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label?: React.ReactNode
  error?: boolean
}

export function TextareaInput({
  label,
  error,
  id,
  maxLength = MAX_TEXT_LENGTH,
  value,
  ...props
}: Props) {
  const count = String(value ?? '').length
  return (
    <div className="w-full">
      {label ? (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      ) : null}
      <textarea
        id={id}
        maxLength={maxLength}
        value={value}
        className={cn(
          'min-h-[120px] w-full resize-y rounded border border-brand-dark-green/30 bg-white px-3 py-2.5 font-sans text-[16px] leading-[1.3] text-brand-dark-green outline-none transition-colors placeholder:text-brand-dark-green/50 focus:border-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-red-600'
        )}
        {...props}
      />
      <p
        className="mt-1 text-right font-mono text-[10px] leading-[1.3] text-brand-dark-green/60 tabular-nums"
        aria-live="polite"
      >
        {count}/{maxLength}
      </p>
    </div>
  )
}
