'use client'

import type { ReactNode } from 'react'
import { usePathname } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

export function ZineChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return pathname.startsWith(`${ROUTES.zines}/`) ? null : children
}
