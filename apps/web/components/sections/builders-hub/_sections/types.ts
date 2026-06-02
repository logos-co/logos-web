/**
 * Shared types for the Builders Hub home page sections. Each section file
 * imports the slice it renders from `@repo/content/*` plus these shared shapes.
 */
export type Cta = {
  label: string
  href: string
  external?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link'
}
