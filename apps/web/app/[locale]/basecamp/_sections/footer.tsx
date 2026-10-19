'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { FooterArrowIcon, FooterChevronIcon } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'
import { asset, Brand } from './atoms'
import { submitDefaultNewsletterSignup } from '@/lib/newsletter-signup'

export function Footer({ copy }: { copy: Renewal['footer'] }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await submitDefaultNewsletterSignup({ email, role, city })
      setSubmitted(true)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }
  return (
    <footer className="bc-footer">
      <div className="bc-footer-main">
        <div className="bc-footer-photo">
          <Image
            src={`${asset}/footer-photo.png`}
            alt=""
            width={480}
            height={271}
          />
        </div>
        <div className="bc-footer-tagline">
          <Brand size={20} />
          <p>{copy.tagline}</p>
        </div>
        <div className="bc-footer-links">
          <div>
            {copy.links.map((link) => (
              <a href={link.href} className="cursor-pointer" key={link.label}>
                {link.label}
              </a>
            ))}
          </div>
          <div>
            {copy.socials.map((link) => (
              <a href={link.href} className="cursor-pointer" key={link.label}>
                {link.label}
              </a>
            ))}
          </div>
          <div>
            <strong>{copy.researchLabel}</strong>
            {copy.research.map((link) => (
              <a href={link.href} className="cursor-pointer" key={link.label}>
                {link.label}
              </a>
            ))}
          </div>
          <div>
            <strong>{copy.infrastructureLabel}</strong>
            {copy.infrastructure.map((link) => (
              <a href={link.href} className="cursor-pointer" key={link.label}>
                {link.label}
              </a>
            ))}
          </div>
          <div>
            {copy.legal.map((link) => (
              <a href={link.href} className="cursor-pointer" key={link.label}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="bc-footer-form">
          <h3>{copy.newsletterTitle}</h3>
          <input
            type="email"
            required
            aria-label={copy.emailLabel}
            placeholder={copy.emailLabel}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div>
            <span className="bc-footer-field">
              <input
                aria-label={copy.roleLabel}
                placeholder={copy.roleLabel}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
              <FooterChevronIcon />
            </span>
            <span className="bc-footer-field">
              <input
                aria-label={copy.cityLabel}
                placeholder={copy.cityLabel}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
              <FooterChevronIcon />
            </span>
            <button type="submit" className="cursor-pointer">
              {copy.submitLabel}
              <FooterArrowIcon />
            </button>
          </div>
          {submitted && <span role="status">{copy.successLabel}</span>}
          {failed && <span role="alert">{copy.errorLabel}</span>}
        </form>
      </div>
    </footer>
  )
}
