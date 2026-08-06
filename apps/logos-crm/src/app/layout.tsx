import './globals.css'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { QueryProvider } from '@/components/query-provider'

import { rhymesDisplay } from './fonts'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')

  return {
    title: t('title'),
    description: t('description'),
  }
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
