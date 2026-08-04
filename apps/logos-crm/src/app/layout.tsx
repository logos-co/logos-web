import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { QueryProvider } from '@/components/query-provider'

import { rhymesDisplay } from './fonts'

export const metadata: Metadata = {
  title: 'Logos CRM',
  description: 'The self-hosted coordination workspace for Logos.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={rhymesDisplay.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
