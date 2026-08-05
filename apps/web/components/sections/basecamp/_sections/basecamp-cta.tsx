'use client'

import { useEffect, useState } from 'react'

import type { CTA } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'
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

function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'download') {
    return <IconMask src="/icons/download.svg" className="size-[15px]" />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
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

export function BasecampCta({
  cta,
  className,
}: {
  cta: CTA
  className?: string
}) {
  const fallbackLinkProps = resolveBasecampInstallCtaLinkProps(cta)
  const [href, setHref] = useState(fallbackLinkProps.href)

  useEffect(() => {
    // Install CTAs must retain platform detection even when content marks the
    // destination as external; the content URL is only the release fallback.
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

  return (
    <Button
      {...fallbackLinkProps}
      href={href}
      variant={cta.variant ?? 'secondary'}
      icon={getButtonIcon(cta.iconOverride)}
      className={className}
    >
      {cta.label}
    </Button>
  )
}
