'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/constants/routes'

export default function SiteFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return pathname?.includes(ROUTES.basecamp) ? null : <>{children}</>
}
