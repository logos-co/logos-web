import { EXTERNAL_URLS } from '@/constants/routes'

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

export function resolveBasecampInstallCtaHref(cta: InstallCtaLike): string {
  if (installLinuxLabel.test(cta.label)) {
    return EXTERNAL_URLS.basecampLinuxDownload
  }

  if (installMacLabel.test(cta.label)) {
    return EXTERNAL_URLS.basecampMacDownload
  }

  if (
    cta.iconOverride === 'download' &&
    cta.label.toLowerCase().includes('install')
  ) {
    return EXTERNAL_URLS.basecampRelease
  }

  return cta.href
}

export function resolveBasecampInstallCtaLinkProps(
  cta: InstallCtaLike
): BasecampInstallCtaLinkProps {
  const href = resolveBasecampInstallCtaHref(cta)
  const isBasecampReleaseUrl =
    href === EXTERNAL_URLS.basecampRelease ||
    href === EXTERNAL_URLS.basecampLinuxDownload ||
    href === EXTERNAL_URLS.basecampMacDownload

  return cta.external || isBasecampReleaseUrl
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href }
}
