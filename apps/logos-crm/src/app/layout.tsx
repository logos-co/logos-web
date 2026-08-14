import './globals.css'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { QueryProvider } from '@/components/query-provider'
import { getServerEnv } from '@/server/env'

import { rhymesDisplay } from './fonts'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // Deployed previews run without a login screen. That is only defensible while
  // everyone looking at them can see it, so the instance says what it is on
  // every page rather than in a README nobody opens.
  const isDemo = getServerEnv().AUTH_MODE === 'demo'

  return (
    <html lang="en" className={rhymesDisplay.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
        {isDemo ? (
          <p className="demo-badge">
            Demo — seeded data, no sign-in. Never enter a real person&rsquo;s
            details.
          </p>
        ) : null}
      </body>
    </html>
  )
}
