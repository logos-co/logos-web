/**
 * Shared types for the Get Started page sections.
 */

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
