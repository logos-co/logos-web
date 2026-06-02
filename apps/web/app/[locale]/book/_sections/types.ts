/**
 * Shared types for the Book page sections.
 */
export interface BookActionItem {
  label: string
  subtext: string
  href: string
  external?: boolean
}

export interface BookAuthor {
  name: string
  image: string
  text: readonly string[]
}
