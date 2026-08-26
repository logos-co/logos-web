/**
 * Mention handles that appear in a note body.
 *
 * Matches `@` followed by an email address or a dotted handle, which is what
 * people actually type when referring to a colleague. Parsing is a pure
 * function so the rule can be tested without a database, and so the server -
 * never the client - decides who was mentioned.
 *
 * The leading set includes the Markdown emphasis markers. Notes are Markdown
 * now, and without them `**@mara.chen**` matched nothing: bolding a name
 * silently cancelled the notification, which is the worst way for this to
 * fail because the author sees the mention rendered and assumes it was sent.
 *
 * The backtick is deliberately absent. A handle inside a code span is being
 * quoted, not addressed, and should not put a message in somebody's inbox.
 */
const MENTION_PATTERN = /(^|[\s(<[*_~])@([\w.+-]+(?:@[\w-]+(?:\.[\w-]+)+)?)/g

/**
 * Trailing punctuation belongs to the sentence, not to the handle - and so do
 * the closing emphasis markers, or `@mara.chen` written in bold would resolve
 * to the handle `mara.chen**`.
 */
function trimTrailingPunctuation(handle: string): string {
  return handle.replace(/[.,;:!?)\]>*_~]+$/, '')
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
