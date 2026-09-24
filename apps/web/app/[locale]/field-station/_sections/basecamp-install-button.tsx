'use client'

import { useEffect, useState } from 'react'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'

import { APPLICATION, BASECAMP_RELEASE_HREF, EVENT_NAMES } from '../_content'

const RELEASE_ASSETS = {
  linuxArm64:
    'https://github.com/logos-co/logos-basecamp/releases/download/0.3.0/LogosBasecamp-Desktop-v0.3.0-bbe5da-aarch64.AppImage',
  linuxX64:
    'https://github.com/logos-co/logos-basecamp/releases/download/0.3.0/LogosBasecamp-Desktop-v0.3.0-bbe5da-x86_64.AppImage',
  macArm64:
    'https://github.com/logos-co/logos-basecamp/releases/download/0.3.0/LogosBasecamp-Desktop-v0.3.0-bbe5da-aarch64.dmg',
  windowsX64:
    'https://github.com/logos-co/logos-basecamp/releases/download/0.3.0/LogosBasecamp-Desktop-v0.3.0-bbe5da-x86_64-windows-setup.exe',
} as const

interface ClientPlatform {
  architecture?: string
  bitness?: string
  platform?: string
}

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string
    getHighEntropyValues?: (
      hints: ReadonlyArray<'architecture' | 'bitness' | 'platform'>
    ) => Promise<ClientPlatform>
  }
}

export function resolveFieldStationDownloadTarget(
  client: ClientPlatform & { userAgent?: string }
): string {
  const platform =
    `${client.platform ?? ''} ${client.userAgent ?? ''}`.toLowerCase()
  const highEntropyArchitecture = (client.architecture ?? '').toLowerCase()
  const architecture = /aarch64|arm64|armv8|^arm$/.test(highEntropyArchitecture)
    ? 'arm64'
    : /x86_64|x64|amd64/.test(highEntropyArchitecture) ||
        (highEntropyArchitecture === 'x86' && client.bitness === '64')
      ? 'x86_64'
      : /aarch64|arm64|armv8/.test(platform)
        ? 'arm64'
        : /x86_64|x64|amd64|win64|wow64|macintel/.test(platform)
          ? 'x86_64'
          : 'unknown'

  if (/windows|win32|win64/.test(platform) && architecture === 'x86_64') {
    return RELEASE_ASSETS.windowsX64
  }
  if (/macos|macintosh|mac os|macintel/.test(platform) && architecture === 'arm64') {
    return RELEASE_ASSETS.macArm64
  }
  if (/linux|x11/.test(platform)) {
    if (architecture === 'arm64') return RELEASE_ASSETS.linuxArm64
    if (architecture === 'x86_64') return RELEASE_ASSETS.linuxX64
  }
  return BASECAMP_RELEASE_HREF
}

export function BasecampInstallButton() {
  const [href, setHref] = useState<string>(BASECAMP_RELEASE_HREF)

  useEffect(() => {
    const userAgentData = (navigator as NavigatorWithUserAgentData)
      .userAgentData
    let cancelled = false

    async function resolveDownload(): Promise<void> {
      let details: ClientPlatform = { platform: userAgentData?.platform }
      try {
        details =
          (await userAgentData?.getHighEntropyValues?.([
            'architecture',
            'bitness',
            'platform',
          ])) ?? details
      } catch {
        // The release page remains available when browser hints are blocked.
      }
      if (!cancelled) {
        setHref(
          resolveFieldStationDownloadTarget({
            ...details,
            platform: details.platform ?? navigator.platform,
            userAgent: navigator.userAgent,
          })
        )
      }
    }

    void resolveDownload()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Button
      href={href}
      variant="primary"
      icon={<IconMask src="/icons/download.svg" className="size-[15px]" />}
      className="cursor-pointer"
      data-umami-event-name={EVENT_NAMES.applicationInstall}
    >
      {APPLICATION.rows[0]?.cta?.label}
    </Button>
  )
}
