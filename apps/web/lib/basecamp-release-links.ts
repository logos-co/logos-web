import { ROUTES } from '@/constants/routes'

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

export function resolveBasecampInstallCtaHref(cta: InstallCtaLike): string {
  if (installLinuxLabel.test(cta.label)) {
    return `${ROUTES.basecampDownload}?platform=linux`
  }

  if (installMacLabel.test(cta.label)) {
    return `${ROUTES.basecampDownload}?platform=macos`
  }

  if (cta.iconOverride === 'download' && installLabel.test(cta.label)) {
    return ROUTES.basecampDownload
  }

  return cta.href
}

export function resolveBasecampInstallCtaLinkProps(
  cta: InstallCtaLike
): BasecampInstallCtaLinkProps {
  const href = resolveBasecampInstallCtaHref(cta)
  const isBasecampDownloadUrl = href.startsWith(ROUTES.basecampDownload)

  return cta.external || isBasecampDownloadUrl
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href }
}
