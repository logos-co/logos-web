'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

// Routes that render their own header and must hide the global SiteHeader.
const CHROMELESS_HEADER_PATHS = [ROUTES.ukDebt]

type SiteHeaderGateProps = {
  children: ReactNode
}

export default function SiteHeaderGate({ children }: SiteHeaderGateProps) {
  const pathname = usePathname()
  const isChromeless = CHROMELESS_HEADER_PATHS.some((path) =>
    pathname?.includes(path)
  )

  if (isChromeless) {
    return null
  }

  return <>{children}</>
}
