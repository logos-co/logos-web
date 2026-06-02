/**
 * Shared data shapes for the UK Debt page sections.
 */
export type SpendingItem = {
  value: string
  label: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
}

export type Orb = {
  src: string
  className: string
  alt: string
  floatX: number
  floatY: number
}
