'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'

import {
  PickedCountry,
  pickedCityInputStyle,
  useCityAutocomplete,
  usePickedCountryWidth,
  type CitySearch,
  type CitySuggestion,
} from '../city-autocomplete'
import { FooterArrowIcon, FooterChevronIcon } from './footer-icons'

/** Role choices offered in the custom dropdown. */
const DEFAULT_ROLE_OPTIONS = ['Node operator', 'Builder', 'Activist'] as const

type SignupStatus = 'idle' | 'loading' | 'success' | 'error'

export type FooterNewsletterValues = {
  email: string
  role: string
  city: string
  /** Country of the picked city, or empty. */
  country: string
}

export type FooterNewsletterProps = {
  emailLabel: string
  roleLabel: string
  cityLabel: string
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
  /**
   * City suggestions. Picking one sets the submitted `country`; a typed city
   * that was not picked is refused.
   */
  searchCities: CitySearch
  /** Legend explaining the asterisk on the email field. */
  requiredLabel?: string
  /** Message shown after a successful submit. */
  successMessage?: string
}

const fieldClassName =
  'text-eyebrow h-[32px] border border-brand-off-white/50 px-3 py-2 text-center text-brand-off-white normal-case backdrop-blur-[5px] bg-transparent outline-none placeholder:text-brand-off-white placeholder:uppercase'

const triggerClassName =
  'text-eyebrow flex h-[32px] w-full cursor-pointer items-center justify-center gap-1 border border-brand-off-white/50 px-3 py-2 text-brand-off-white backdrop-blur-[5px]'

// Same font, padding, border width and alignment as the city field.
const pickedCountryClassName =
  'text-eyebrow justify-center border border-transparent px-3 py-2 normal-case'

// A picked city reads in caps, like the country next to it.
const pickedCityClassName = 'uppercase'

// Same as the country in a suggestion.
const countryClassName = 'pl-1 uppercase text-brand-off-white/60'

const optionClassName =
  'text-eyebrow flex w-full cursor-pointer items-center px-3 py-2 text-left text-brand-off-white uppercase transition-colors hover:bg-brand-off-white/10'

const submitClassName =
  'text-eyebrow flex h-[32px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green uppercase backdrop-blur-[5px] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60'

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
  submitLabel,
  onSubmit,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  searchCities,
  requiredLabel = 'required',
  successMessage = 'Thanks — you’re on the list.',
}: FooterNewsletterProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  // Country of the picked city suggestion, empty for typed text.
  const [country, setCountry] = useState('')
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [status, setStatus] = useState<SignupStatus>('idle')
  const [message, setMessage] = useState('')

  const roleRef = useRef<HTMLDivElement>(null)

  const isBusy = status === 'loading' || status === 'success'

  const handleSelectCity = (suggestion: CitySuggestion) => {
    setCity(suggestion.name)
    setCountry(suggestion.country)
  }

  const { countryRef, countryWidth } = usePickedCountryWidth(country)

  const cityAutocomplete = useCityAutocomplete({
    search: searchCities,
    query: city,
    onSelect: handleSelectCity,
  })

  const closeRole = useCallback(() => setIsRoleOpen(false), [])
  useDismiss(roleRef, isRoleOpen, closeRole)

  const handleSelectRole = (option: string) => {
    setRole(option)
    setIsRoleOpen(false)
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

    // A typed city that was not picked has no country.
    if (city.trim() && !country) {
      setStatus('error')
      setMessage('Pick a city from the list.')
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

        <div
          className="relative min-w-0 flex-1"
          ref={cityAutocomplete.containerRef}
        >
          <input
            type="text"
            name="city"
            placeholder={cityLabel}
            value={city}
            disabled={isBusy}
            onChange={(event) => {
              setCity(event.target.value)
              setCountry('')
              cityAutocomplete.open()
            }}
            className={`w-full ${fieldClassName}`}
            style={pickedCityInputStyle('0.75rem', countryWidth, !!country)}
            aria-label={cityLabel}
            {...cityAutocomplete.inputProps}
          />
          <PickedCountry
            city={city}
            country={country}
            countryRef={countryRef}
            className={pickedCountryClassName}
            cityClassName={pickedCityClassName}
            countryClassName={countryClassName}
          />

          {cityAutocomplete.isOpen && (
            <ul
              id={cityAutocomplete.listId}
              role="listbox"
              aria-label={cityLabel}
              className="absolute top-[calc(100%+4px)] right-0 z-50 max-h-[200px] w-full min-w-[200px] overflow-y-auto border border-brand-off-white/50 bg-brand-dark-green backdrop-blur-[5px]"
            >
              {cityAutocomplete.suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.name}|${suggestion.country}`}
                  id={cityAutocomplete.optionId(index)}
                  role="option"
                  aria-selected={index === cityAutocomplete.activeIndex}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => cityAutocomplete.select(suggestion)}
                    onMouseEnter={() => cityAutocomplete.setActiveIndex(index)}
                    className={`${optionClassName} flex-wrap gap-x-1 ${
                      index === cityAutocomplete.activeIndex
                        ? 'bg-brand-off-white/10'
                        : ''
                    }`}
                  >
                    <span>{suggestion.name}</span>
                    <span className="text-brand-off-white/60">
                      {suggestion.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex w-full items-center gap-1">
        <button
          type="submit"
          disabled={isBusy}
          className={`${submitClassName} w-full`}
        >
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
