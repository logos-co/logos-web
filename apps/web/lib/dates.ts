/**
 * Centralised date formatters.
 *
 * Every page/section that renders a published-at or event date should call
 * one of these instead of redefining `Intl.DateTimeFormat` inline. Keeping
 * format choices in one place means a copy change ("MM.DD.YY" → "DD/MM/YY")
 * is a one-line edit.
 *
 * All formatters operate in UTC and the `en-US` locale to match the Figma
 * specs; localisation hooks belong in their own helper if/when needed.
 */

const UTC_LOCALE = 'en-US'
const UTC = 'UTC'

/**
 * `MM.DD.YY` (UTC, `en-US` 2-digit). Used by press articles and
 * tech-domain related-articles cards.
 */
export function formatDateMdy2(iso: string): string {
  const parts = new Intl.DateTimeFormat(UTC_LOCALE, {
    timeZone: UTC,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${month}.${day}.${year}`
}

/**
 * `Jan 15, 2025` (UTC, `en-US` short month + numeric year). Used by
 * builders-hub detail pages. Returns the input string unchanged when the
 * argument cannot be parsed as a date.
 */
export function formatDateLong(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(UTC_LOCALE, {
    timeZone: UTC,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Short timezone offset label (`PST`, `KST`, ...). Used by event lists
 * that show local-time-aware metadata.
 *
 * Falls back to the input `timeZone` string when the runtime rejects it
 * (e.g. malformed zone, ICU data missing) — callers want to keep rendering
 * something rather than blow up the whole event list.
 */
export function formatTzOffsetLabel(timeZone: string, iso: string): string {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat(UTC_LOCALE, {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date(iso))
  } catch {
    return timeZone
  }
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone
}
