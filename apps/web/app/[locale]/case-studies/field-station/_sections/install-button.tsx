'use client'

import { Button } from '@/components/ui'
import { EXTERNAL_URLS } from '@/constants/routes'
import { useBasecampInstallLink } from '@/lib/use-basecamp-install-link'

const install = {
  label: 'Install Basecamp',
  href: EXTERNAL_URLS.basecampRelease,
}

export function InstallButton({ label }: { label: string }) {
  const link = useBasecampInstallLink(install)
  return <Button {...link}>{label}</Button>
}
