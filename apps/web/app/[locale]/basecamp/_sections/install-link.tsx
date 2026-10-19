'use client'

import type { ReactNode } from 'react'
import type { CTA } from '@repo/content/schemas'

import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'

export function InstallLink({
  cta,
  children,
  className = '',
  platform,
}: {
  cta: CTA
  children?: ReactNode
  className?: string
  platform?: 'macos' | 'linux'
}) {
  const resolved = useBasecampInstallLink({
    ...cta,
    label:
      platform === 'macos'
        ? 'Install Mac'
        : platform === 'linux'
          ? 'Install Linux'
          : 'Install Basecamp',
  })
  return (
    <a
      {...resolved}
      className={`bc-button cursor-pointer ${className}`}
      data-umami-event-name={cta.label}
    >
      {children ?? cta.label}
    </a>
  )
}
