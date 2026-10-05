'use client'

import type { ComponentProps } from 'react'

import type { InstallCtaLike } from '@/lib/basecamp-release-links'
import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'

interface BasecampDownloadLinkProps extends Omit<ComponentProps<'a'>, 'href'> {
  cta: InstallCtaLike
}

export function BasecampDownloadLink({
  cta,
  ...props
}: BasecampDownloadLinkProps) {
  const linkProps = useBasecampInstallLink(cta)
  return <a {...props} {...linkProps} />
}
