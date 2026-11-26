import { submitNewsletterSignup } from '@/lib/newsletter-signup'

export interface NodeProgrammeSignupInput {
  email: string
}

export function submitNodeProgrammeSignup({ email }: NodeProgrammeSignupInput) {
  return submitNewsletterSignup({ email, note: 'Source: Node programme' })
}
