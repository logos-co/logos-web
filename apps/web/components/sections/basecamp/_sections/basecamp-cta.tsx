'use client'

import type { ReactNode } from 'react'

import type { CTA } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button, type ButtonVariant } from '@/components/ui'
import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'
import type { BasecampInstallationPurpose } from '@/lib/basecamp-download-target'

function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'download') {
    return <IconMask src="/icons/download.svg" className="size-[15px]" />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
}

export function BasecampCta({
  cta,
  className,
  eventName,
  icon,
  defaultVariant = 'secondary',
  installationPurpose,
}: {
  cta: CTA
  className?: string
  /** Stable Umami event name; the tracker falls back to the label. */
  eventName?: string
  icon?: ReactNode | false
  defaultVariant?: ButtonVariant
  installationPurpose?: BasecampInstallationPurpose
}) {
  const linkProps = useBasecampInstallLink(cta, installationPurpose)

  return (
    <Button
      {...linkProps}
      variant={cta.variant ?? defaultVariant}
      icon={icon ?? getButtonIcon(cta.iconOverride)}
      className={className}
      data-umami-event-name={eventName}
    >
      {cta.label}
    </Button>
  )
}
