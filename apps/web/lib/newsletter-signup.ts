/**
 * Newsletter signup transport for the footer form.
 *
 * The site is a static export (`output: 'export'`), so there is no server
 * route to proxy through. This module ports the logic of the legacy
 * `logos.co/api/email-signup` route handler to the client: it resolves the
 * upstream newsletter-subscribe endpoint by API mode and posts the same
 * payload shape (`{ email, type, newsletter, note }`) directly.
 *
 * The upstream (`admin-acid.logos.co`) restricts CORS to an allowlist of
 * Logos-owned origins, so direct calls succeed on production domains
 * (logos.co, dev.logos.co, *.vercel.app) but are blocked on `localhost`.
 */
import { env } from '@/lib/env'

const SUBSCRIBE_ENDPOINTS = {
  development: 'http://localhost:3010/api/admin/newsletters/subscribe',
  staging: 'https://dev-admin-acid.logos.co/api/admin/newsletters/subscribe',
  production: 'https://admin-acid.logos.co/api/admin/newsletters/subscribe',
} as const

/** Default site newsletter (matches the legacy route handler). */
const DEFAULT_NEWSLETTER_ID = '6913441fee2f120001cec90d'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type NewsletterSignupInput = {
  email: string
  role?: string
  city?: string
  /** Override the target newsletter. Defaults to the site newsletter. */
  newsletterId?: string
}

type SignupResponse = {
  error?: unknown
  message?: unknown
}

function getSubscribeEndpoint(): string {
  const mode = env.NEXT_PUBLIC_API_MODE ?? 'production'
  return SUBSCRIBE_ENDPOINTS[mode]
}

/** Compose the freeform `note` field from the optional role + city inputs. */
function buildNote(role?: string, city?: string): string {
  const parts: string[] = []
  if (role?.trim()) {
    parts.push(`Role: ${role.trim()}`)
  }
  if (city?.trim()) {
    parts.push(`City: ${city.trim()}`)
  }
  return parts.join('\n')
}

function getErrorMessage(data: SignupResponse): string | null {
  return typeof data.error === 'string' ? data.error : null
}

/**
 * Subscribe an email to the newsletter. Throws an `Error` with a
 * user-presentable message on validation or request failure.
 */
export async function submitNewsletterSignup({
  email,
  role,
  city,
  newsletterId,
}: NewsletterSignupInput): Promise<void> {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Please enter a valid email address.')
  }

  const note = buildNote(role, city)

  const response = await fetch(getSubscribeEndpoint(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      type: 'logos',
      newsletter: newsletterId ?? DEFAULT_NEWSLETTER_ID,
      ...(note && { note }),
    }),
  })

  const data = (await response.json().catch(() => ({}))) as SignupResponse

  if (!response.ok) {
    throw new Error(getErrorMessage(data) ?? 'Failed to subscribe.')
  }
}
