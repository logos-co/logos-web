'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/constants/routes'

export default function SiteFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const route = pathname?.replace(/\/$/, '')
  if (route?.endsWith(ROUTES.railgun)) {
    return (
      <div className="railgun-footer-theme" data-header-tone="dark">
        {children}
      </div>
    )
  }
  const isBasecamp = route?.endsWith(ROUTES.basecamp)

  if (isBasecamp) {
    return <div className="basecamp-footer-theme">{children}</div>
  }
  if (
    route?.endsWith(ROUTES.muster) ||
    route?.endsWith(ROUTES.fieldStationCaseStudy)
  ) {
    return <div data-header-tone="dark">{children}</div>
  }
  return <>{children}</>
}
