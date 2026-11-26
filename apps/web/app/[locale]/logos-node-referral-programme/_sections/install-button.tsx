'use client'

import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'

import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'

import { ProgrammeButton } from './button'

interface InstallButtonProps {
  cta: NodeReferralProgrammeCopySection['basecamp']['installCta']
}

export function InstallButton({ cta }: InstallButtonProps) {
  const link = useBasecampInstallLink(cta)
  return <ProgrammeButton {...link}>{cta.label}</ProgrammeButton>
}
