'use client'

import { useEffect } from 'react'

import { EXTERNAL_URLS } from '@/constants/routes'
import { resolveBasecampDownloadTarget } from '@/lib/basecamp-download-target'

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

function getPreferredPlatform(): string | null {
  return new URLSearchParams(window.location.search).get('platform')
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

export default function BasecampDownloadRedirect() {
  useEffect(() => {
    let isCancelled = false

    async function redirectToDownload(): Promise<void> {
      const clientPlatform = await getClientPlatform()
      const target = resolveBasecampDownloadTarget({
        ...clientPlatform,
        platform: clientPlatform.platform ?? navigator.platform,
        preferredPlatform: getPreferredPlatform(),
        userAgent: navigator.userAgent,
      })

      if (!isCancelled) {
        window.location.replace(target)
      }
    }

    void redirectToDownload()

    return () => {
      isCancelled = true
    }
  }, [])

  return null
}
