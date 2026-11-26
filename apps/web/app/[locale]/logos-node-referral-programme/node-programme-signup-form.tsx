'use client'

import { useId, useState, type FormEvent } from 'react'
import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'

import { ProgrammeButton } from './_sections/button'
import { EXTERNAL_URLS } from '@/constants/routes'

import { submitNodeProgrammeSignup } from './node-programme-signup'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SignupStatus = 'idle' | 'loading' | 'success' | 'error'

interface NodeProgrammeSignupFormProps {
  copy: NodeReferralProgrammeCopySection['signup']
}

export function NodeProgrammeSignupForm({
  copy,
}: NodeProgrammeSignupFormProps) {
  const emailId = useId()
  const statusId = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SignupStatus>('idle')
  const [error, setError] = useState('')
  const isLoading = status === 'loading'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setStatus('error')
      setError(copy.invalidEmail)
      return
    }

    setStatus('loading')
    setError('')

    try {
      await submitNodeProgrammeSignup({ email: trimmedEmail })
      setEmail('')
      setStatus('success')
    } catch {
      setStatus('error')
      setError(copy.genericError)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <label
        htmlFor={emailId}
        className="block font-mono-body text-[10px] leading-[1.3] text-brand-dark-green/60 uppercase"
      >
        {copy.emailLabel}
      </label>
      <div className="mt-4 flex min-h-[57px] items-start gap-4 border-b border-brand-dark-green pb-4 focus-within:ring-1 focus-within:ring-brand-dark-green">
        <input
          id={emailId}
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
          aria-invalid={status === 'error'}
          aria-describedby={statusId}
          className="w-full min-w-0 flex-1 bg-transparent font-sans text-4xl leading-[1.1] tracking-[-0.02em] text-brand-dark-green outline-none placeholder:text-brand-dark-green/30"
        />
        <ProgrammeButton
          type="submit"
          disabled={isLoading}
          className="mt-[4.5px] shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? copy.submitting : copy.submit}
        </ProgrammeButton>
      </div>
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className={`${status === 'idle' ? '' : 'mt-2'} font-sans text-sm leading-[1.3]`}
      >
        {status === 'success' ? (
          <p>
            {copy.success}{' '}
            <a
              href={EXTERNAL_URLS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer underline underline-offset-2"
            >
              {copy.successLink}
            </a>
          </p>
        ) : null}
        {status === 'error' ? <p>{error}</p> : null}
      </div>
    </form>
  )
}
