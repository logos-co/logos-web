'use client'

import type { ReactNode } from 'react'

import type { CTA } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button, type ButtonVariant } from '@/components/ui'
import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'

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
}: {
  cta: CTA
  className?: string
  /** Stable Umami event name; the tracker falls back to the label. */
  eventName?: string
  icon?: ReactNode | false
  defaultVariant?: ButtonVariant
}) {
  const linkProps = useBasecampInstallLink(cta)

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
