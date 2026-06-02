/**
 * App-level Button wrapper that pre-binds next-intl's `Link` to the `@acid-info/logos-ui`
 * Button primitive. Use this in apps/web wherever an internal route is linked
 * so locale-aware navigation is preserved.
 */
import { Button as UIButton, type ButtonProps } from '@acid-info/logos-ui'

import { Link } from '@/i18n/navigation'

export { ButtonArrowIcon } from '@acid-info/logos-ui'
export type { ButtonProps, ButtonVariant } from '@acid-info/logos-ui'

export function Button(props: ButtonProps) {
  if ('href' in props && props.href !== undefined) {
    // External URLs render a native <a> that opens in a new tab — routing them
    // through next-intl's Link would prepend the active locale and break the
    // link.
    if (/^https?:\/\//.test(props.href)) {
      return (
        <UIButton
          linkAs={'a' as const}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      )
    }
    // Same-page hash anchors (e.g. "#map") render a native <a>; everything else
    // gets next-intl's locale-aware Link. Routing a hash through Link makes the
    // App Router re-append it on repeat navigations, producing "#map#map" — a
    // native anchor just sets location.hash and never doubles it.
    const linkAs = props.href.startsWith('#') ? ('a' as const) : Link
    return <UIButton linkAs={linkAs} {...props} />
  }
  return <UIButton {...props} />
}
