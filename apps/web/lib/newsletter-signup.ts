/**
 * Newsletter signup transport for the site's signup forms.
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
  ukDebt: '6a0dd2f8d5b09400014fed2e',
} as const

const DEFAULT_NEWSLETTER_ID = NEWSLETTER_IDS.logos

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type NewsletterSignupInput = {
  email: string
  role?: string
  city?: string
  country?: string
  /** Override the target newsletter. Defaults to the site newsletter. */
  newsletterId?: string
  /**
   * Sent verbatim instead of a note composed from `role` / `city` / `country`.
   * The upstream appends it to the member's existing note, so send one entry
   * per call.
   */
  note?: string
  /**
   * Everything else the submitting form collected, sent as top-level payload
   * fields. Resolved keys win over a form field of the same name.
   */
  formFields?: Record<string, unknown>
  /** `false` skips the upstream auto-reply email. Defaults to sending it. */
  sendAutoReply?: boolean
}

export type DefaultNewsletterSignupInput = Pick<
  NewsletterSignupInput,
  'email' | 'role' | 'city' | 'country' | 'formFields'
>

type SignupResponse = {
  error?: unknown
  message?: unknown
}

function getSubscribeEndpoint(): string {
  const mode = env.NEXT_PUBLIC_API_MODE ?? 'production'
  return SUBSCRIBE_ENDPOINTS[mode]
}

/** Compose the freeform `note` field from the optional role, city and country. */
function buildNote(role?: string, city?: string, country?: string): string {
  const parts: string[] = []
  if (role?.trim()) {
    parts.push(`Role: ${role.trim()}`)
  }
  if (city?.trim()) {
    parts.push(`City: ${city.trim()}`)
  }
  if (country?.trim()) {
    parts.push(`Country: ${country.trim()}`)
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
  country,
  newsletterId,
  note: noteOverride,
  formFields,
  sendAutoReply,
}: NewsletterSignupInput): Promise<void> {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Please enter a valid email address.')
  }

  const note = noteOverride ?? buildNote(role, city, country)

  const body = JSON.stringify({
    // Submitted fields first, so the resolved keys below win a name clash.
    ...formFields,
    ...trimmedField('role', role),
    ...trimmedField('city', city),
    ...trimmedField('country', country),
    email,
    type: 'logos',
    newsletter: newsletterId ?? DEFAULT_NEWSLETTER_ID,
    // `undefined` drops the key, so an empty note omits it rather than
    // letting a forwarded `note` stand in.
    note: note || undefined,
    sendAutoReply,
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

/**
 * Signup for forms without a newsletter choice: always the site newsletter,
 * plus the Regional Newsletter when both a city and a country were given, the
 * upstream rejects either alone. Throws only when the site newsletter
 * subscription fails.
 *
 * Sequential by necessity: the upstream merges the note into the member's
 * existing one with a read-modify-write, so concurrent calls lose a note.
 */
export async function submitDefaultNewsletterSignup({
  email,
  role,
  city,
  country,
  formFields,
}: DefaultNewsletterSignupInput): Promise<void> {
  await submitNewsletterSignup({ email, role, city, country, formFields })

  if (!city?.trim() || !country?.trim()) return

  try {
    await submitNewsletterSignup({
      email,
      role,
      city,
      country,
      formFields,
      newsletterId: NEWSLETTER_IDS.regional,
      // The site newsletter subscription already sent both; a second note
      // would be appended again to the same member.
      note: '',
      sendAutoReply: false,
    })
  } catch (error) {
    logger.warn('Regional newsletter subscription failed', { error })
  }
}
