'use client'

import { useEffect, useState } from 'react'

import {
  resolveBasecampDownloadTarget,
  type BasecampInstallationPurpose,
} from '@/lib/basecamp-download-target'
import {
  isBasecampInstallCta,
  resolveBasecampInstallCtaLinkProps,
  resolveBasecampInstallPreferredPlatform,
  type InstallCtaLike,
  type BasecampInstallCtaLinkProps,
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

export function useBasecampInstallLink(
  cta: InstallCtaLike,
  purpose?: BasecampInstallationPurpose
): BasecampInstallCtaLinkProps {
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
        purpose,
      })

      if (!isCancelled) setHref(target)
    }

    void resolveDownload()

    return () => {
      isCancelled = true
    }
  }, [cta, purpose])

  return { ...fallbackLinkProps, href }
}
