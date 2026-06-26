import type { ReactNode } from 'react'

import './field-guide.css'

/**
 * Scope for the ported Field Guide styles. Importing the CSS here keeps the
 * `.fg-*` rules available across the index and chapter routes. The global
 * site header/footer are hidden for these paths (see SiteHeaderGate /
 * SiteFooterGate) so the guide renders as its own self-contained reading
 * experience, matching the reference site.
 */
export default function FieldGuideLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
