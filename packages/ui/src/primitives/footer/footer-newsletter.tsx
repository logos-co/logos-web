'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { FooterArrowIcon, FooterChevronIcon } from './footer-icons'

/** Role choices offered in the custom dropdown. */
const DEFAULT_ROLE_OPTIONS = ['Node operator', 'Builder', 'Activist'] as const

type SignupStatus = 'idle' | 'loading' | 'success' | 'error'

export type FooterNewsletterValues = {
  email: string
  role: string
  city: string
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
  /** Message shown after a successful submit. */
  successMessage?: string
}

const fieldClassName =
  'text-eyebrow h-[32px] border border-brand-off-white/50 px-3 py-2 text-center text-brand-off-white normal-case backdrop-blur-[5px] bg-transparent outline-none placeholder:text-brand-off-white placeholder:uppercase'

const triggerClassName =
  'text-eyebrow flex h-[32px] w-full cursor-pointer items-center justify-center gap-1 border border-brand-off-white/50 px-3 py-2 text-brand-off-white backdrop-blur-[5px]'

const submitClassName =
  'text-eyebrow flex h-[32px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 text-brand-dark-green uppercase backdrop-blur-[5px] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60'

export function FooterNewsletter({
  emailLabel,
  roleLabel,
  cityLabel,
  submitLabel,
  onSubmit,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  successMessage = 'Thanks — you’re on the list.',
}: FooterNewsletterProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [status, setStatus] = useState<SignupStatus>('idle')
  const [message, setMessage] = useState('')

  const roleRef = useRef<HTMLDivElement>(null)

  const isBusy = status === 'loading' || status === 'success'

  useEffect(() => {
    if (!isRoleOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isRoleOpen])

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

    setStatus('loading')
    setMessage('')

    try {
      await onSubmit({ email, role, city })

      setEmail('')
      setRole('')
      setCity('')
      setStatus('success')
      setMessage(successMessage)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Failed to subscribe.',
      )
    }
  }

  return (
    <form className="flex w-full flex-col gap-1" onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        autoComplete="email"
        placeholder={emailLabel}
        value={email}
        disabled={isBusy}
        onChange={(event) => setEmail(event.target.value)}
        className={`w-full ${fieldClassName}`}
        aria-label={emailLabel}
      />

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
                    className={`text-eyebrow flex w-full cursor-pointer items-center px-3 py-2 text-left text-brand-off-white uppercase transition-colors hover:bg-brand-off-white/10 ${
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

        <button type="submit" disabled={isBusy} className={submitClassName}>
          {submitLabel}
          <FooterArrowIcon />
        </button>
      </div>

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
