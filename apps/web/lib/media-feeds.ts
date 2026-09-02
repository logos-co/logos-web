/**
 * Guards for feed documents copied in from the legacy blog.
 *
 * blog.logos.co answers unknown paths with its single-page-app shell under a
 * 200 and `content-type: text/html`, so an ok status is not proof of a feed.
 * Writing that HTML to a `.xml` subscription URL would break every reader
 * without failing anything loudly, which is exactly the failure this catches.
 */

/** RSS and Atom documents both open with a declaration or their root element. */
const FEED_ROOT_PATTERN = /^\uFEFF?\s*(<\?xml[\s?]|<rss[\s>]|<feed[\s>])/i

export function isFeedXml(body: string): boolean {
  return FEED_ROOT_PATTERN.test(body)
}
