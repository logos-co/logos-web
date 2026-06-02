/**
 * Shared types for the Movement page sections. Each section file imports the
 * slice it needs (e.g. the `Translate` function or `CtaProps`).
 */
export type Translate = (key: string) => string

export type CtaTone = 'primary' | 'secondary' | 'tertiary' | 'light' | 'link'

export type CtaProps = {
  href: string
  label: string
  tone?: CtaTone
  className?: string
}
