import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { DemoShell } from '@/components/demo-shell'

export const metadata: Metadata = {
  title: 'Logos Demos',
  description:
    'Try the Logos stack from a browser — no account, no install, no backend.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoShell>{children}</DemoShell>
      </body>
    </html>
  )
}
