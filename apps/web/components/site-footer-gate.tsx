'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/constants/routes'

export default function SiteFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const route = pathname?.replace(/\/$/, '')
  if (route?.endsWith(ROUTES.railgun)) return null
  const isBasecamp = route?.endsWith(ROUTES.basecamp)

  return isBasecamp ? (
    <div className="basecamp-footer-theme">{children}</div>
  ) : (
    <>{children}</>
  )
}
