'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/constants/routes'

export default function SiteFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isBasecamp = pathname?.replace(/\/$/, '').endsWith(ROUTES.basecamp)

  if (isBasecamp) {
    return <div className="basecamp-footer-theme">{children}</div>
  }
  if (pathname?.replace(/\/$/, '').endsWith(ROUTES.muster)) {
    return <div data-header-tone="dark">{children}</div>
  }
  return <>{children}</>
}
