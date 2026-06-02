/**
 * Shared types for the Get Started page sections. The page-level translator is
 * passed to each section so the section JSX can read its own copy slice via the
 * same `t(...)` keys it used when the page was a single file.
 */
import type { getTranslations } from 'next-intl/server'

export type GetStartedTranslator = Awaited<ReturnType<typeof getTranslations>>

export interface DocItem {
  key: string
  href: string
}

export interface CommunityLink {
  key: string
  href: string
}

export interface BuildItem {
  key: string
  ctaKey: string
  href: string
  hasBody?: boolean
}
