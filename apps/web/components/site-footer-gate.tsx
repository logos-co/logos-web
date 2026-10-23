'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/constants/routes'

export default function SiteFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isBasecamp = pathname?.replace(/\/$/, '').endsWith(ROUTES.basecamp)

  return isBasecamp ? (
    <div className="basecamp-footer-theme">{children}</div>
  ) : (
    <>{children}</>
  )
}
