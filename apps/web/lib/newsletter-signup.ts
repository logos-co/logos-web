/**
 * Newsletter signup transport for the footer form.
 *
 * The site is a static export (`output: 'export'`), so there is no server
 * route to proxy through. This module ports the logic of the legacy
 * `logos.co/api/email-signup` route handler to the client: it resolves the
 * upstream newsletter-subscribe endpoint by API mode and posts the same
 * payload shape (`{ email, type, newsletter, note }`) directly, plus every
 * other field the submitting form collected -- the upstream forwards those to
 * the auto-reply filters. There is no per-field allowlist here.
 *
 * The upstream (`admin-acid.logos.co`) restricts CORS to an allowlist of
 * Logos-owned origins, so direct calls succeed on production domains
 * (logos.co, dev.logos.co, *.vercel.app) but are blocked on `localhost`.
 */
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

const SUBSCRIBE_ENDPOINTS = {
  development: 'http://localhost:3003/api/admin/newsletters/subscribe',
  staging: 'https://dev-admin-acid.logos.co/api/admin/newsletters/subscribe',
  production: 'https://admin-acid.logos.co/api/admin/newsletters/subscribe',
} as const

/** Ghost newsletter ids. `logos` is the default site newsletter. */
export const NEWSLETTER_IDS = {
  logos: '6913441fee2f120001cec90d',
  regional: '6a672fa7d5b09400014fffa1',
} as const

const DEFAULT_NEWSLETTER_ID = NEWSLETTER_IDS.logos

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type NewsletterSignupInput = {
  email: string
  role?: string
  city?: string
  /** Override the target newsletter. Defaults to the site newsletter. */
  newsletterId?: string
  /**
   * Sent verbatim instead of a note composed from `role` / `city`. The upstream
   * appends it to the member's existing note, so send one entry per call.
   */
  note?: string
  /**
   * Everything else the submitting form collected, sent as top-level payload
   * fields. Resolved keys win over a form field of the same name.
   */
  formFields?: Record<string, unknown>
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

/** `{ [key]: trimmed }` when the value has content, otherwise nothing. */
function trimmedField(
  key: string,
  value?: string
): Record<string, string> | undefined {
  const trimmed = value?.trim()
  return trimmed ? { [key]: trimmed } : undefined
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
  note: noteOverride,
  formFields,
}: NewsletterSignupInput): Promise<void> {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Please enter a valid email address.')
  }

  const note = noteOverride ?? buildNote(role, city)

  const body = JSON.stringify({
    // Submitted fields first, so the resolved keys below win a name clash.
    ...formFields,
    ...trimmedField('role', role),
    ...trimmedField('city', city),
    email,
    type: 'logos',
    newsletter: newsletterId ?? DEFAULT_NEWSLETTER_ID,
    // `undefined` drops the key, so an empty note omits it rather than
    // letting a forwarded `note` stand in.
    note: note || undefined,
  })

  const endpoint = getSubscribeEndpoint()
  // Parsed back so the log is exactly what goes over the wire.
  logger.debug('Newsletter subscribe request', {
    endpoint,
    payload: JSON.parse(body) as unknown,
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  })

  const data = (await response.json().catch(() => ({}))) as SignupResponse

  if (!response.ok) {
    throw new Error(getErrorMessage(data) ?? 'Failed to subscribe.')
  }
}
