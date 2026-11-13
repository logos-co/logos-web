'use client'

import type { CTA } from '@repo/content/schemas'

import { Button } from '@/components/ui'
import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'

export function InstallButton({ cta }: { cta: CTA }) {
  const link = useBasecampInstallLink(cta)
  return (
    <Button {...link} className="muster-button muster-button-light">
      {cta.label}
    </Button>
  )
}
