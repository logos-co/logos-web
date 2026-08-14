/**
 * Mention handles that appear in a note body.
 *
 * Matches `@` followed by an email address or a dotted handle, which is what
 * people actually type when referring to a colleague. Parsing is a pure
 * function so the rule can be tested without a database, and so the server —
 * never the client — decides who was mentioned.
 */
const MENTION_PATTERN = /(^|[\s(<[])@([\w.+-]+(?:@[\w-]+(?:\.[\w-]+)+)?)/g

/** Trailing punctuation belongs to the sentence, not to the handle. */
function trimTrailingPunctuation(handle: string): string {
  return handle.replace(/[.,;:!?)\]>]+$/, '')
}

export function parseMentionHandles(body: string): string[] {
  const handles = new Set<string>()

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const raw = match[2]
    if (!raw) continue
    const handle = trimTrailingPunctuation(raw).toLocaleLowerCase('en')
    if (handle.length > 0) handles.add(handle)
  }

  return [...handles]
}

/** A note excerpt short enough to be safe in an email subject or preview. */
export const NOTIFICATION_EXCERPT_LENGTH = 200

export function buildExcerpt(body: string): string {
  const collapsed = body.replace(/\s+/g, ' ').trim()
  return collapsed.length <= NOTIFICATION_EXCERPT_LENGTH
    ? collapsed
    : `${collapsed.slice(0, NOTIFICATION_EXCERPT_LENGTH - 1)}…`
}
