'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'

import styles from '../ukdebt.module.css'

const UK_DEBT_NEWSLETTER_ID = '6a0dd2f8d5b09400014fed2e'
// Target deploys as a static export (no API routes), so the signup posts
// directly to the live logos.co proxy instead of a relative /api path.
const SIGNUP_ENDPOINT = 'https://logos.co/api/email-signup'

export function Cta() {
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [signupStatus, setSignupStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [signupMessage, setSignupMessage] = useState('')

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !email.includes('@')) {
      setSignupStatus('error')
      setSignupMessage('Please enter a valid email address.')
      return
    }

    setSignupStatus('loading')
    setSignupMessage('')

    try {
      const response = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newsletter: UK_DEBT_NEWSLETTER_ID,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe.')
      }

      setEmail('')
      setSignupStatus('success')
      setSignupMessage('You’re on the list.')
    } catch (error) {
      setSignupStatus('error')
      setSignupMessage(
        error instanceof Error ? error.message : 'Failed to subscribe.',
      )
    }
  }

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaBackdrop} aria-hidden="true" />
      <h2 className={styles.titleReveal}>
        Exit the system.
        <br />
        Build the alternative.
      </h2>
      <div className={styles.ctaActions}>
        <div className={styles.ctaPrimaryRow}>
          <Link
            className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
            href="/active-circles"
          >
            Join a Circle
          </Link>
        </div>
        <div className={styles.ctaSecondaryRow}>
          <button
            className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
            type="button"
            aria-expanded={isSignupOpen}
            aria-controls="ukdebt-signup"
            onClick={() => {
              setIsSignupOpen((open) => !open)
              setSignupStatus('idle')
              setSignupMessage('')
            }}
          >
            Stay Informed
          </button>
          <a
            className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
            href="mailto:uk@logos.co"
          >
            Contact us
          </a>
        </div>
      </div>
      {isSignupOpen && (
        <form
          className={styles.ctaSignup}
          id="ukdebt-signup"
          onSubmit={handleSignupSubmit}
        >
          <label className={styles.ctaSignupLabel} htmlFor="ukdebt-email">
            Email
          </label>
          <input
            id="ukdebt-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter email"
            value={email}
            disabled={signupStatus === 'loading'}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" disabled={signupStatus === 'loading'}>
            {signupStatus === 'loading' ? 'Submitting' : 'Subscribe'}
          </button>
          {signupMessage && (
            <p
              className={`${styles.ctaSignupMessage} ${
                signupStatus === 'error' ? styles.ctaSignupError : ''
              }`}
              role={signupStatus === 'error' ? 'alert' : 'status'}
            >
              {signupMessage}
            </p>
          )}
        </form>
      )}
      <img src="/assets/logos-black.svg" alt="" aria-hidden="true" />
    </section>
  )
}
