import './globals.css'

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { DemoShell } from '@/components/demo-shell'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  // Makes every relative URL below absolute, which Open Graph requires.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Each demo supplies only its own name.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  // The shell is a fixed dark sidebar on a light page in both schemes, so the
  // browser chrome should not be told to invert anything.
  colorScheme: 'light',
  // --color-brand-dark-green, the sidebar's ground.
  themeColor: '#152521',
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
