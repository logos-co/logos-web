import '@/css/tailwind.css'

import type { ReactNode } from 'react'
import type { Viewport } from 'next'

import { themeInitScript } from '@/lib/theme'
import { fontVariables } from '@/app/fonts'
import PageTransition from '@/components/page-transition'
import { Providers } from '@/components/providers'
import ScrollToTop from '@/components/scroll-to-top'
import SiteHeader from '@/components/site-header'
import SiteHeaderGate from '@/components/site-header/site-header-gate'
import SiteFooter from '@/components/site-footer'
import UmamiButtonTracker from '@/components/umami-button-tracker'
import { routing } from '@/i18n/routing'

import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import Script from 'next/script'

export const dynamicParams = false

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <NextIntlClientProvider>
      <html
        lang={locale}
        className={`scroll-smooth ${fontVariables}`}
        suppressHydrationWarning
      >
        <head>
          <link rel="apple-touch-icon" sizes="76x76" href="/favicon.ico" />
          <link rel="icon" href="/favicon.ico" type="image/x-icon" />
          <script
            dangerouslySetInnerHTML={{
              __html: themeInitScript,
            }}
          />
          <Script
            strategy="afterInteractive"
            src="https://umami.bi.status.im/script.js"
            data-website-id="144fa9a5-fe44-4bf3-a585-45742cfa89cc"
            data-domains="dev.logos.co"
          />
        </head>
        <body>
          <Providers>
            <UmamiButtonTracker />
            <ScrollToTop />
            <SiteHeaderGate>
              <SiteHeader locale={locale} />
            </SiteHeaderGate>
            <main className="relative">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter locale={locale} />
          </Providers>
        </body>
      </html>
    </NextIntlClientProvider>
  )
}
