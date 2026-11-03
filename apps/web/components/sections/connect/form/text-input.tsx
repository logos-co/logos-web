import type { InputHTMLAttributes, ReactNode } from 'react'

import { MAX_TEXT_LENGTH } from '@/lib/funnel-forms/contactFormSchema'
import { cn } from '@/lib/cn'

import { FieldLabel } from './field-label'

const inputClassName =
  'w-full rounded border border-brand-dark-green/30 bg-white px-3 py-2.5 font-sans text-[16px] leading-[1.2] text-brand-dark-green outline-none transition-colors placeholder:text-brand-dark-green/50 focus:border-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label?: React.ReactNode
  error?: boolean
  wrapperClassName?: string
  overLimitMessage?: string
  /** Drawn over the input, positioned against it rather than the label. */
  inputOverlay?: ReactNode
}

export function TextInput({
  label,
  error,
  id,
  wrapperClassName,
  maxLength = MAX_TEXT_LENGTH,
  value,
  overLimitMessage,
  inputOverlay,
  ...props
}: Props) {
  const count = String(value ?? '').length
  // Allow typing/pasting past the limit, but flag it instead of silently
  // truncating. Mirrors the schema, which accepts exactly `maxLength` and
  // rejects anything longer.
  const isOverLimit = count > maxLength
  const input = (
    <input
      id={id}
      value={value}
      aria-invalid={error || isOverLimit || undefined}
      className={cn(inputClassName, (error || isOverLimit) && 'border-red-600')}
      {...props}
    />
  )
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      {inputOverlay ? (
        <div className="relative">
          {input}
          {inputOverlay}
        </div>
      ) : (
        input
      )}
      {isOverLimit ? (
        <div
          className="mt-1 flex items-center gap-2 font-mono text-xs leading-[1.3] font-semibold text-red-600"
          aria-live="polite"
        >
          {overLimitMessage ? <p>{overLimitMessage}</p> : null}
          <p className="ml-auto tabular-nums">
            {count}/{maxLength}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export { inputClassName }
