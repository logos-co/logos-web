import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AppNav from '@/components/layout/AppNav'

export const metadata: Metadata = {
  title: 'Logos CiviCRM',
  description: 'Internal web layer for managing Logos Circle Cases in CiviCRM',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  )
}
