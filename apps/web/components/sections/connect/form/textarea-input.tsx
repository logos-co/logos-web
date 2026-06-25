import type { TextareaHTMLAttributes } from 'react'

import { MAX_TEXT_LENGTH } from '@/lib/civicrm/contactFormSchema'
import { cn } from '@/lib/cn'

import { FieldLabel } from './field-label'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label?: React.ReactNode
  error?: boolean
  overLimitMessage?: string
}

export function TextareaInput({
  label,
  error,
  id,
  maxLength = MAX_TEXT_LENGTH,
  value,
  overLimitMessage,
  ...props
}: Props) {
  const count = String(value ?? '').length
  // Allow typing/pasting past the limit, but flag it instead of silently
  // truncating. Mirrors the schema, which accepts exactly `maxLength` and
  // rejects anything longer.
  const isOverLimit = count > maxLength
  return (
    <div className="w-full">
      {label ? (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      ) : null}
      <textarea
        id={id}
        value={value}
        aria-invalid={error || isOverLimit || undefined}
        className={cn(
          'min-h-[120px] w-full resize-y rounded border border-brand-dark-green/30 bg-white px-3 py-2.5 font-sans text-[16px] leading-[1.3] text-brand-dark-green outline-none transition-colors placeholder:text-brand-dark-green/50 focus:border-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60',
          (error || isOverLimit) && 'border-red-600'
        )}
        {...props}
      />
      <div
        className="mt-1 flex items-center gap-2 font-mono text-[10px] leading-[1.3]"
        aria-live="polite"
      >
        {isOverLimit && overLimitMessage ? (
          <p className="font-semibold text-red-600">{overLimitMessage}</p>
        ) : null}
        <p
          className={cn(
            'ml-auto tabular-nums',
            isOverLimit
              ? 'font-semibold text-red-600'
              : 'text-brand-dark-green/60'
          )}
        >
          {count}/{maxLength}
        </p>
      </div>
    </div>
  )
}
