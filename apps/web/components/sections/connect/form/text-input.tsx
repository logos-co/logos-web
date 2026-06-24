import type { InputHTMLAttributes } from 'react'

import { MAX_TEXT_LENGTH } from '@/lib/civicrm/contactFormSchema'
import { cn } from '@/lib/cn'

import { FieldLabel } from './field-label'

const inputClassName =
  'w-full rounded border border-brand-dark-green/30 bg-white px-3 py-2.5 font-sans text-[16px] leading-[1.2] text-brand-dark-green outline-none transition-colors placeholder:text-brand-dark-green/50 focus:border-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label?: React.ReactNode
  error?: boolean
  wrapperClassName?: string
}

export function TextInput({
  label,
  error,
  id,
  wrapperClassName,
  maxLength = MAX_TEXT_LENGTH,
  ...props
}: Props) {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label ? (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      ) : null}
      <input
        id={id}
        maxLength={maxLength}
        className={cn(inputClassName, error && 'border-red-600')}
        {...props}
      />
    </div>
  )
}

export { inputClassName }
