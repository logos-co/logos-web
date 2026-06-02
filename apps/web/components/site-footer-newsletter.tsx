'use client'

import { useMutation } from '@tanstack/react-query'
import {
  FooterNewsletter,
  type FooterNewsletterValues,
} from '@acid-info/logos-ui/client'

import { submitNewsletterSignup } from '@/lib/newsletter-signup'

type SiteFooterNewsletterProps = {
  emailLabel: string
  roleLabel: string
  cityLabel: string
  submitLabel: string
}

/**
 * Client wrapper that wires the shared `FooterNewsletter` form to the
 * newsletter signup transport via react-query. Kept in the app (not the UI
 * package) so the primitive stays free of data-fetching dependencies.
 */
export function SiteFooterNewsletter(props: SiteFooterNewsletterProps) {
  const mutation = useMutation({
    mutationFn: (values: FooterNewsletterValues) =>
      submitNewsletterSignup(values),
  })

  return <FooterNewsletter {...props} onSubmit={mutation.mutateAsync} />
}
