import type { ReactNode } from 'react'

import { FieldGuideThemeProvider } from '@/components/sections/field-guide'

import './field-guide.css'

/**
 * Scope for the ported Field Guide styles. Importing the CSS here keeps the
 * `.fg-*` rules available across the index and chapter routes. The global
 * site header/footer are hidden for these paths (see SiteHeaderGate /
 * SiteFooterGate) so the guide renders as its own self-contained reading
 * experience, matching the reference site.
 *
 * The theme provider lives here (not in the page) so the Paper/Ink choice
 * survives client-side chapter navigation without remounting/flashing.
 */
export default function FieldGuideLayout({
  children,
}: {
  children: ReactNode
}) {
  return <FieldGuideThemeProvider>{children}</FieldGuideThemeProvider>
}
