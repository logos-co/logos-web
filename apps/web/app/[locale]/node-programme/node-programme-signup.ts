import { submitNewsletterSignup } from '@/lib/newsletter-signup'

interface NodeProgrammeSignupInput {
  email: string
  role: string
}

export function submitNodeProgrammeSignup({
  email,
  role,
}: NodeProgrammeSignupInput): Promise<void> {
  return submitNewsletterSignup({ email, role })
}
