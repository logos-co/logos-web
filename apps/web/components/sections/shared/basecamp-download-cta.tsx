'use client'

import { useEffect, useState, type ReactNode } from 'react'

import type { CTA } from '@repo/content/schemas'

import { Button, type ButtonVariant } from '@/components/ui'
import { resolveBasecampDownloadTarget } from '@/lib/basecamp-download-target'
import {
  isBasecampInstallCta,
  resolveBasecampInstallCtaLinkProps,
  resolveBasecampInstallPreferredPlatform,
} from '@/lib/basecamp-release-links'

interface UserAgentDataValues {
  architecture?: string
  bitness?: string
  platform?: string
}

interface UserAgentData {
  platform?: string
  getHighEntropyValues?: (
    hints: ReadonlyArray<'architecture' | 'bitness' | 'platform'>
  ) => Promise<UserAgentDataValues>
}

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: UserAgentData
}

async function getClientPlatform(): Promise<UserAgentDataValues> {
  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData

  if (!userAgentData?.getHighEntropyValues) {
    return { platform: userAgentData?.platform }
  }

  try {
    return await userAgentData.getHighEntropyValues([
      'architecture',
      'bitness',
      'platform',
    ])
  } catch {
    return { platform: userAgentData.platform }
  }
}

export function useBasecampDownloadHref(cta: CTA): string {
  const fallbackHref = resolveBasecampInstallCtaLinkProps(cta).href
  const [href, setHref] = useState(fallbackHref)

  useEffect(() => {
    if (!isBasecampInstallCta(cta)) return

    let isCancelled = false

    async function resolveDownload(): Promise<void> {
      const clientPlatform = await getClientPlatform()
      const target = resolveBasecampDownloadTarget({
        ...clientPlatform,
        platform: clientPlatform.platform ?? navigator.platform,
        preferredPlatform: resolveBasecampInstallPreferredPlatform(cta),
        userAgent: navigator.userAgent,
      })

      if (!isCancelled) setHref(target)
    }

    void resolveDownload()

    return () => {
      isCancelled = true
    }
  }, [cta])

  return href
}

export function BasecampDownloadButton({
  cta,
  defaultVariant = 'secondary',
  icon,
  className,
  eventName,
}: {
  cta: CTA
  defaultVariant?: ButtonVariant
  icon?: ReactNode | false
  className?: string
  eventName?: string
}) {
  const href = useBasecampDownloadHref(cta)

  return (
    <Button
      {...resolveBasecampInstallCtaLinkProps(cta)}
      href={href}
      variant={cta.variant ?? defaultVariant}
      icon={icon}
      className={className}
      data-umami-event-name={eventName}
    >
      {cta.label}
    </Button>
  )
}

export function BasecampDownloadLink({
  cta,
  className,
  eventName,
  children,
}: {
  cta: CTA
  className: string
  eventName?: string
  children: ReactNode
}) {
  const href = useBasecampDownloadHref(cta)
  const linkProps = resolveBasecampInstallCtaLinkProps(cta)

  return (
    <a
      {...linkProps}
      href={href}
      {...(/^https?:\/\//.test(href)
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      className={className}
      aria-label={cta.label}
      data-umami-event-name={eventName}
    >
      {children}
    </a>
  )
}
