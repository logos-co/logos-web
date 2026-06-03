'use client'

import { useTranslations } from 'next-intl'
import { useId, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui'
import { EXTERNAL_URLS } from '@/constants/routes'

import { submitNodeProgrammeSignup } from './node-programme-signup'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SignupStatus = 'idle' | 'loading' | 'success' | 'error'

export function NodeProgrammeSignupForm() {
  const t = useTranslations('pages.nodeProgramme.signup')
  const emailId = useId()
  const roleId = useId()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<SignupStatus>('idle')
  const [error, setError] = useState('')
  const roles = t.raw('roles') as string[]
  const isLoading = status === 'loading'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!EMAIL_PATTERN.test(email)) {
      setStatus('error')
      setError(t('invalidEmail'))
      return
    }

    if (!role) {
      setStatus('error')
      setError(t('missingRole'))
      return
    }

    setStatus('loading')
    setError('')

    try {
      await submitNodeProgrammeSignup({ email, role })
      setEmail('')
      setRole('')
      setStatus('success')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : t('genericError'))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[604px] flex-col gap-2 text-brand-dark-green"
    >
      <div className="grid gap-2 rounded-[4px] border border-brand-dark-green/40 bg-brand-off-white/90 p-2 backdrop-blur md:grid-cols-[1fr_170px_auto] md:items-center">
        <label className="sr-only" htmlFor={emailId}>
          {t('emailLabel')}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          className="text-mono-s min-h-10 w-full border border-brand-dark-green/20 bg-transparent px-3 text-brand-dark-green outline-none transition-colors placeholder:text-brand-dark-green/45 focus:border-brand-dark-green md:border-0"
        />

        <label className="sr-only" htmlFor={roleId}>
          {t('roleLabel')}
        </label>
        <select
          id={roleId}
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={isLoading}
          className="text-mono-s h-10 w-full cursor-pointer rounded-[4px] border border-brand-dark-green/25 bg-transparent px-3 text-brand-dark-green outline-none transition-colors focus:border-brand-dark-green"
        >
          <option value="">{t('rolePlaceholder')}</option>
          {roles.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 cursor-pointer rounded-[4px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </div>

      <div className="text-mono-s min-h-[34px] text-brand-dark-green">
        {status === 'success' ? (
          <p>
            {t('success')}{' '}
            <a
              href={EXTERNAL_URLS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer underline underline-offset-2"
            >
              {t('successLink')}
            </a>
            .
          </p>
        ) : null}
        {status === 'error' ? <p>{error}</p> : null}
      </div>
    </form>
  )
}
