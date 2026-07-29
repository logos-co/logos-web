/**
 * Ghost newsletter subscriptions for the funnel form opt-in checkboxes:
 * `wantsNewsletter` -> Logos Newsletter, `wantsEvents` -> Regional Newsletter.
 * Each subscription carries a note that is appended to the member profile, and
 * forwards the submitted answers so the upstream can filter on them.
 */
import { getProfileForForm } from '@repo/funnel'

import { logger } from '@/lib/logger'
import { NEWSLETTER_IDS, submitNewsletterSignup } from '@/lib/newsletter-signup'

export type FunnelNewsletterSignupInput = {
  email: string
  /** Afform form name, e.g. `afformCoalitionPartner`. */
  formName?: string
  wantsNewsletter: boolean
  wantsEvents: boolean
  city?: string
  /** Country label, not the CiviCRM option id. */
  country?: string
  /** The submitted answers, forwarded to the subscribe endpoint. */
  formFields?: Record<string, unknown>
}

type FieldOption = { value: string; label: string }

/** Selectable options per form key, e.g. `{ country: [{ value, label }] }`. */
export type FieldOptions = Record<string, readonly FieldOption[]>

/**
 * Map a submitted option id to its label. Unmatched numeric ids are dropped so
 * a bare `1001` never ships; other values pass through as free text.
 */
export function resolveOptionLabel(
  value: unknown,
  options: readonly FieldOption[]
): string {
  const first = Array.isArray(value) ? value[0] : value
  const raw = typeof first === 'string' ? first.trim() : ''
  if (!raw) return ''

  const match = options.find((option) => option.value === raw)
  if (match) return match.label

  return /^\d+$/.test(raw) ? '' : raw
}

/**
 * Swap option ids for the labels the user picked. The subscribe endpoint has
 * no access to the CiviCRM option lists, so an id would reach it unreadable.
 * Values without options (text, checkboxes) are left alone.
 */
export function toLabelledFormFields(
  formData: Record<string, unknown>,
  fieldOptions: FieldOptions
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(formData).map(([key, value]) => {
      const options = fieldOptions[key]
      if (!options?.length) return [key, value]

      // 1:1, blanks kept: `chat` and `chatService` pair up by index.
      if (Array.isArray(value)) {
        return [key, value.map((item) => resolveOptionLabel(item, options))]
      }

      if (typeof value !== 'string') return [key, value]

      return [key, resolveOptionLabel(value, options)]
    })
  )
}

/** `Label: value` line, or nothing when the value is blank. */
function noteLine(label: string, value?: string): string[] {
  const trimmed = value?.trim()
  return trimmed ? [`${label}: ${trimmed}`] : []
}

export function buildLogosNewsletterNote(profile?: string): string {
  return noteLine('Profile', profile).join('\n')
}

export function buildRegionalNewsletterNote({
  city,
  country,
  profile,
}: {
  city?: string
  country?: string
  profile?: string
}): string {
  return [
    ...noteLine('City', city),
    ...noteLine('Country', country),
    ...noteLine('Profile', profile),
  ].join('\n')
}

async function subscribeQuietly(
  newsletterId: string,
  email: string,
  note: string,
  formFields?: Record<string, unknown>
): Promise<void> {
  try {
    await submitNewsletterSignup({ email, newsletterId, note, formFields })
  } catch (error) {
    logger.warn('Funnel newsletter subscription failed', {
      newsletterId,
      error,
    })
  }
}

/**
 * Subscribe to the newsletters the ticked checkboxes ask for. Never rejects.
 *
 * Sequential by necessity: the upstream merges the note into the member's
 * existing one with a read-modify-write, so concurrent calls lose a note.
 */
export async function submitFunnelNewsletterSignups({
  email,
  formName,
  wantsNewsletter,
  wantsEvents,
  city,
  country,
  formFields,
}: FunnelNewsletterSignupInput): Promise<void> {
  if (!wantsNewsletter && !wantsEvents) return

  const address = email.trim()
  const profile = getProfileForForm(formName)

  if (wantsNewsletter) {
    await subscribeQuietly(
      NEWSLETTER_IDS.logos,
      address,
      buildLogosNewsletterNote(profile),
      formFields
    )
  }

  if (wantsEvents) {
    await subscribeQuietly(
      NEWSLETTER_IDS.regional,
      address,
      buildRegionalNewsletterNote({ city, country, profile }),
      formFields
    )
  }
}
