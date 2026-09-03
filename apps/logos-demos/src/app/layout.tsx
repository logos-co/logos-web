import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Logos on the web',
  description:
    'A browser that joins a peer-to-peer network directly — no account, no install, no backend.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
