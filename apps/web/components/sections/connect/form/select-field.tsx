'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'

import type { FieldOption } from '../get-field-options'
import { FieldError } from './field-error'
import { FieldLabel } from './field-label'

type Props = {
  id: string
  label?: string
  options: FieldOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string | null
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  required,
  disabled,
  error,
  errorMessage,
  isOpen,
  onToggle,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (ref.current && !ref.current.contains(target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="w-full" ref={ref}>
      {label ? (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      ) : null}
      <div
        className={cn(
          'relative w-full rounded border border-brand-dark-green/30 bg-white',
          error && 'border-red-600'
        )}
      >
        <button
          type="button"
          id={id}
          onClick={onToggle}
          disabled={disabled}
          aria-label={label || placeholder}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex h-11 w-full items-center justify-between gap-2 px-3 text-left font-sans text-[16px] text-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={cn('truncate', !value && 'text-brand-dark-green/50')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
        {isOpen ? (
          <div
            role="listbox"
            className="absolute bottom-full left-0 z-50 mb-2 max-h-40 w-full overflow-y-auto rounded border border-brand-dark-green/20 bg-white shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                onClick={() => {
                  onChange(opt.value)
                  onClose()
                }}
                className={cn(
                  'w-full px-3 py-2 text-left font-sans text-[14px] hover:bg-brand-dark-green/5',
                  value === opt.value && 'bg-brand-dark-green/10 font-semibold'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <FieldError visible={!!error && !!errorMessage}>{errorMessage}</FieldError>
    </div>
  )
}

type MultiselectProps = {
  id: string
  label: string
  options: FieldOption[]
  value: string[]
  onToggleOption: (optionValue: string) => void
  required?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string | null
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function MultiselectField({
  id,
  label,
  options,
  value,
  onToggleOption,
  required,
  disabled,
  error,
  errorMessage,
  isOpen,
  onToggle,
  onClose,
}: MultiselectProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (ref.current && !ref.current.contains(target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const displayLabel =
    value.length === 0
      ? 'Select…'
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? '1 selected')
        : `${value.length} selected`

  return (
    <div className="w-full" ref={ref}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        className={cn(
          'relative w-full rounded border border-brand-dark-green/30 bg-white',
          error && 'border-red-600'
        )}
      >
        <button
          type="button"
          id={id}
          onClick={onToggle}
          disabled={disabled}
          aria-label={label}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex h-11 w-full items-center justify-between gap-2 px-3 text-left font-sans text-[16px] text-brand-dark-green disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={cn('truncate', value.length === 0 && 'text-brand-dark-green/50')}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
        {isOpen ? (
          <div
            role="listbox"
            aria-multiselectable
            className="absolute bottom-full left-0 z-50 mb-2 max-h-40 w-full overflow-y-auto rounded border border-brand-dark-green/20 bg-white shadow-lg"
          >
            {options.map((opt) => {
              const isSelected = value.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onToggleOption(opt.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-sans text-[14px] hover:bg-brand-dark-green/5',
                    isSelected && 'bg-brand-dark-green/10 font-semibold'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected ? (
                    <Check className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
      <FieldError visible={!!error && !!errorMessage}>{errorMessage}</FieldError>
    </div>
  )
}
