/**
 * Anchor primitive for external URLs.
 *
 * Always sets `target="_blank"` and a hardened `rel="noopener noreferrer"`,
 * so callers don't need to remember the security/perf invariant on every
 * external link they render. Forwards every other anchor prop unchanged.
 *
 * Use this in place of writing `<a target="_blank" rel="noopener noreferrer">`
 * by hand. For internal locale-aware links, keep using `next-intl`'s `<Link>`
 * (or the apps/web `<Button href>` wrapper).
 */
import type { ComponentProps } from 'react'

type ExternalLinkProps = Omit<ComponentProps<'a'>, 'target' | 'rel'>

export function ExternalLink(props: ExternalLinkProps) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />
}
