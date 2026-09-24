import { EXTERNAL_URLS } from '@/constants/routes'

export type BasecampPlatform = 'linux' | 'macos' | 'windows' | 'unknown'
export type BasecampArchitecture = 'arm64' | 'x86_64' | 'unknown'

export interface BasecampClientPlatform {
  readonly architecture?: string
  readonly bitness?: string
  readonly platform?: string
  readonly preferredPlatform?: string | null
  readonly userAgent?: string
}

function detectPlatform({
  platform = '',
  userAgent = '',
}: BasecampClientPlatform): BasecampPlatform {
  const value = `${platform} ${userAgent}`.toLowerCase()

  if (/windows|win32|win64/.test(value)) return 'windows'
  if (/macintosh|mac os|macintel/.test(value)) return 'macos'
  if (/linux|x11/.test(value)) return 'linux'

  return 'unknown'
}

function detectArchitecture({
  architecture = '',
  bitness = '',
  platform = '',
  userAgent = '',
}: BasecampClientPlatform): BasecampArchitecture {
  const highEntropyArchitecture = architecture.toLowerCase()

  if (/aarch64|arm64|armv8|^arm$/.test(highEntropyArchitecture)) {
    return 'arm64'
  }

  if (
    /x86_64|x64|amd64/.test(highEntropyArchitecture) ||
    (/^x86$/.test(highEntropyArchitecture) && bitness === '64')
  ) {
    return 'x86_64'
  }

  const fallback = `${platform} ${userAgent}`.toLowerCase()

  if (/aarch64|arm64|armv8/.test(fallback)) return 'arm64'
  if (/x86_64|x64|amd64|win64|wow64|macintel/.test(fallback)) {
    return 'x86_64'
  }

  return 'unknown'
}

export function resolveBasecampDownloadTarget(
  client: BasecampClientPlatform
): string {
  const detectedPlatform = detectPlatform(client)
  const preferredPlatform =
    client.preferredPlatform === 'linux' ||
    client.preferredPlatform === 'macos'
      ? client.preferredPlatform
      : null

  if (preferredPlatform && preferredPlatform !== detectedPlatform) {
    return EXTERNAL_URLS.basecampRelease
  }

  const platform = preferredPlatform ?? detectedPlatform
  const architecture = detectArchitecture(client)

  if (platform === 'linux' && architecture === 'arm64') {
    return EXTERNAL_URLS.basecampLinuxArm64Download
  }

  if (platform === 'linux' && architecture === 'x86_64') {
    return EXTERNAL_URLS.basecampLinuxX64Download
  }

  if (platform === 'macos' && architecture === 'arm64') {
    return EXTERNAL_URLS.basecampMacArm64Download
  }

  return EXTERNAL_URLS.basecampRelease
}
