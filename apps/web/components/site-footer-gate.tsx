'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/constants/routes'

// Routes that render their own footer (or none) and must hide the global one.
const CHROMELESS_FOOTER_PATHS = [ROUTES.fieldGuide]

type SiteFooterGateProps = {
  children: ReactNode
}

export default function SiteFooterGate({ children }: SiteFooterGateProps) {
  const pathname = usePathname()
  const isChromeless = CHROMELESS_FOOTER_PATHS.some((path) =>
    pathname?.includes(path)
  )

  if (isChromeless) {
    return null
  }

  return <>{children}</>
}
