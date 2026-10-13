'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, RefObject } from 'react'

import { FooterArrowIcon, FooterChevronIcon } from './footer-icons'

/** Role choices offered in the custom dropdown. */
const DEFAULT_ROLE_OPTIONS = ['Node operator', 'Builder', 'Activist'] as const

type SignupStatus = 'idle' | 'loading' | 'success' | 'error'

export type FooterNewsletterValues = {
  email: string
  role: string
  city: string
  /** One of `countryOptions`, or empty. */
  country: string
}

export type FooterNewsletterProps = {
  emailLabel: string
  roleLabel: string
  cityLabel: string
  countryLabel: string
  submitLabel: string
  /**
   * Submit handler. Receives the collected field values and should resolve on
   * success or reject with an `Error` whose message is shown to the user. The
   * component owns its own loading/success/error UI around this promise, so
   * the transport (fetch, react-query, etc.) stays outside this primitive.
   */
  onSubmit: (values: FooterNewsletterValues) => Promise<void>
  /** Override the role choices. Defaults to Node operator / Builder. */
  roleOptions?: readonly string[]
  /** Country choices, searchable. The selected label is submitted as is. */
  countryOptions: readonly string[]
  /** Legend explaining the asterisk on the email field. */
  requiredLabel?: string
  /** Message shown after a successful submit. */
  successMessage?: string
}

const fieldClassName =
  'text-eyebrow h-[32px] border border-brand-off-white/50 px-3 py-2 text-center text-brand-off-white normal-case backdrop-blur-[5px] bg-transparent outline-none placeholder:text-brand-off-white placeholder:uppercase'

const triggerClassName =
  'text-eyebrow flex h-[32px] w-full cursor-pointer items-center justify-center gap-1 border border-brand-off-white/50 px-3 py-2 text-brand-off-white backdrop-blur-[5px]'

const optionClassName =
  'text-eyebrow flex w-full cursor-pointer items-center px-3 py-2 text-left text-brand-off-white uppercase transition-colors hover:bg-brand-off-white/10'

const submitClassName =
  'text-eyebrow flex h-[32px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green uppercase backdrop-blur-[5px] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60'

/** Case and diacritics insensitive, so "cote" finds "Côte d'Ivoire". */
function normalize(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function useDismiss(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [ref, isOpen, onDismiss])
}

export function FooterNewsletter({
  emailLabel,
  roleLabel,
  cityLabel,
  countryLabel,
  submitLabel,
  onSubmit,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  countryOptions,
  requiredLabel = 'required',
  successMessage = 'Thanks — you’re on the list.',
}: FooterNewsletterProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const [activeCountry, setActiveCountry] = useState(0)
  const [status, setStatus] = useState<SignupStatus>('idle')
  const [message, setMessage] = useState('')

  const roleRef = useRef<HTMLDivElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)
  const countryListId = useId()

  const isBusy = status === 'loading' || status === 'success'

  const filteredCountries = useMemo(() => {
    const query = normalize(countryQuery)
    if (!query) {
      return countryOptions
    }
    const matches = countryOptions.filter((option) =>
      normalize(option).includes(query)
    )
    // Prefix matches first, so typing "ger" lands on Germany before Niger.
    return [
      ...matches.filter((option) => normalize(option).startsWith(query)),
      ...matches.filter((option) => !normalize(option).startsWith(query)),
    ]
  }, [countryOptions, countryQuery])

  const closeRole = useCallback(() => setIsRoleOpen(false), [])
  const closeCountry = useCallback(() => setIsCountryOpen(false), [])
  useDismiss(roleRef, isRoleOpen, closeRole)
  useDismiss(countryRef, isCountryOpen, closeCountry)

  useEffect(() => {
    if (isCountryOpen) {
      document
        .getElementById(`${countryListId}-${activeCountry}`)
        ?.scrollIntoView({ block: 'nearest' })
    }
  }, [isCountryOpen, activeCountry, countryListId])

  const handleSelectRole = (option: string) => {
    setRole(option)
    setIsRoleOpen(false)
  }

  const handleToggleCountry = () => {
    setCountryQuery('')
    setActiveCountry(0)
    setIsCountryOpen((open) => !open)
  }

  const handleSelectCountry = (option: string) => {
    setCountry(option)
    setIsCountryOpen(false)
  }

  const handleCountryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveCountry((index) =>
          Math.min(index + 1, filteredCountries.length - 1)
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveCountry((index) => Math.max(index - 1, 0))
        break
      case 'Enter': {
        event.preventDefault()
        const option = filteredCountries[activeCountry]
        if (option) {
          handleSelectCountry(option)
        }
        break
      }
      case 'Escape':
        event.preventDefault()
        setIsCountryOpen(false)
        break
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isBusy) {
      return
    }

    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      await onSubmit({ email, role, city, country })

      setEmail('')
      setRole('')
      setCity('')
      setCountry('')
      setStatus('success')
      setMessage(successMessage)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Failed to subscribe.'
      )
    }
  }

  return (
    <form className="flex w-full flex-col gap-1" onSubmit={handleSubmit}>
      <div className="relative w-full">
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          disabled={isBusy}
          onChange={(event) => setEmail(event.target.value)}
          className={`w-full ${fieldClassName}`}
          aria-label={emailLabel}
          aria-required
        />
        {/* Stands in for the placeholder, which cannot colour the asterisk. */}
        {!email && (
          <span
            aria-hidden
            className="text-eyebrow pointer-events-none absolute inset-0 flex items-center justify-center text-brand-off-white uppercase"
          >
            <span>
              {emailLabel}
              <sup className="ml-px text-red-500">*</sup>
            </span>
          </span>
        )}
      </div>

      <div className="flex w-full items-center gap-1">
        <div className="relative min-w-0 flex-1" ref={roleRef}>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setIsRoleOpen((open) => !open)}
            className={triggerClassName}
            aria-haspopup="listbox"
            aria-expanded={isRoleOpen}
            aria-label={roleLabel}
          >
            <span className="truncate">{role || roleLabel}</span>
            <span
              className={`transition-transform ${isRoleOpen ? 'rotate-180' : ''}`}
            >
              <FooterChevronIcon />
            </span>
          </button>

          {isRoleOpen && (
            <ul
              role="listbox"
              className="absolute top-[calc(100%+4px)] left-0 z-50 w-full overflow-hidden border border-brand-off-white/50 bg-brand-dark-green backdrop-blur-[5px]"
            >
              {roleOptions.map((option) => (
                <li key={option} role="option" aria-selected={role === option}>
                  <button
                    type="button"
                    onClick={() => handleSelectRole(option)}
                    className={`${optionClassName} ${
                      role === option ? 'bg-brand-off-white/10' : ''
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          type="text"
          name="city"
          autoComplete="address-level2"
          placeholder={cityLabel}
          value={city}
          disabled={isBusy}
          onChange={(event) => setCity(event.target.value)}
          className={`min-w-0 flex-1 ${fieldClassName}`}
          aria-label={cityLabel}
        />
      </div>

      <div className="flex w-full items-center gap-1">
        <div className="relative min-w-0 flex-1" ref={countryRef}>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleToggleCountry}
            className={triggerClassName}
            aria-haspopup="listbox"
            aria-expanded={isCountryOpen}
            aria-label={countryLabel}
          >
            <span className="truncate">{country || countryLabel}</span>
            <span
              className={`transition-transform ${isCountryOpen ? 'rotate-180' : ''}`}
            >
              <FooterChevronIcon />
            </span>
          </button>

          {isCountryOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full border border-brand-off-white/50 bg-brand-dark-green backdrop-blur-[5px]">
              <input
                type="text"
                role="combobox"
                autoFocus
                autoComplete="off"
                value={countryQuery}
                onChange={(event) => {
                  setCountryQuery(event.target.value)
                  setActiveCountry(0)
                }}
                onKeyDown={handleCountryKeyDown}
                placeholder={countryLabel}
                aria-label={countryLabel}
                aria-expanded
                aria-controls={countryListId}
                aria-activedescendant={
                  filteredCountries[activeCountry]
                    ? `${countryListId}-${activeCountry}`
                    : undefined
                }
                className={`w-full border-0 border-b ${fieldClassName}`}
              />
              <ul
                id={countryListId}
                role="listbox"
                className="max-h-[200px] overflow-y-auto"
              >
                {country && !countryQuery && (
                  <li role="option" aria-selected={false}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => handleSelectCountry('')}
                      className={`${optionClassName} text-brand-off-white/60`}
                    >
                      {countryLabel}
                    </button>
                  </li>
                )}
                {filteredCountries.map((option, index) => (
                  <li
                    key={option}
                    id={`${countryListId}-${index}`}
                    role="option"
                    aria-selected={country === option}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => handleSelectCountry(option)}
                      onMouseEnter={() => setActiveCountry(index)}
                      className={`${optionClassName} ${
                        index === activeCountry ? 'bg-brand-off-white/10' : ''
                      }`}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="submit" disabled={isBusy} className={submitClassName}>
          {submitLabel}
          <FooterArrowIcon />
        </button>
      </div>

      <p className="text-eyebrow mt-1 text-brand-off-white/70 normal-case [--text-small-size:10px]">
        <span className="text-red-500">*</span> {requiredLabel}
      </p>

      {message && (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className="text-eyebrow mt-1 normal-case text-brand-off-white"
        >
          {message}
        </p>
      )}
    </form>
  )
}
