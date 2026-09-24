import { EXTERNAL_URLS } from '@/constants/routes'
import type { BasecampPlatform } from '@/lib/basecamp-download-target'

interface InstallCtaLike {
  label: string
  href: string
  external?: boolean
  iconOverride?: string
}

interface BasecampInstallCtaLinkProps {
  href: string
  target?: '_blank'
  rel?: 'noopener noreferrer'
}

const installLinuxLabel = /^install linux$/i
const installMacLabel = /^install mac(?:os)?$/i
const installLabel = /^install(?:\s|$)/i

export function resolveBasecampInstallPreferredPlatform(
  cta: InstallCtaLike
): BasecampPlatform | null {
  if (installLinuxLabel.test(cta.label)) return 'linux'
  if (installMacLabel.test(cta.label)) return 'macos'
  return null
}

export function isBasecampInstallCta(cta: InstallCtaLike): boolean {
  return (
    resolveBasecampInstallPreferredPlatform(cta) !== null ||
    (cta.iconOverride === 'download' && installLabel.test(cta.label))
  )
}

export function resolveBasecampInstallCtaHref(cta: InstallCtaLike): string {
  return isBasecampInstallCta(cta) ? EXTERNAL_URLS.basecampRelease : cta.href
}

export function resolveBasecampInstallCtaLinkProps(
  cta: InstallCtaLike
): BasecampInstallCtaLinkProps {
  const href = resolveBasecampInstallCtaHref(cta)
  const isBasecampDownloadUrl =
    href === EXTERNAL_URLS.basecampRelease ||
    href === EXTERNAL_URLS.basecampLinuxArm64Download ||
    href === EXTERNAL_URLS.basecampLinuxX64Download ||
    href === EXTERNAL_URLS.basecampMacArm64Download

  return cta.external || isBasecampDownloadUrl
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href }
}
