import '@/css/tailwind.css'
import './media/media-detail.css'

import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'

import { themeInitScript } from '@/lib/theme'
import { fontVariables } from '@/app/fonts'
<<<<<<< HEAD
import SiteShell from '@/components/site-shell'
=======
import PageTransition from '@/components/page-transition'
import { PodcastPlayerProvider } from '@/app/[locale]/media/_components/podcast-player-context'
import { Providers } from '@/components/providers'
import ScrollToTop from '@/components/scroll-to-top'
import SiteHeader from '@/components/site-header'
import SiteHeaderGate from '@/components/site-header/site-header-gate'
import SiteFooter from '@/components/site-footer'
import UmamiButtonTracker from '@/components/umami-button-tracker'
>>>>>>> 4862129a91 (feat: restore media podcast parity)
import { routing } from '@/i18n/routing'
import { faviconIcons } from '@/lib/favicon'

import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import Script from 'next/script'

export const dynamicParams = false

export const metadata: Metadata = {
  icons: faviconIcons,
}

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
          <script
            dangerouslySetInnerHTML={{
              __html: themeInitScript,
            }}
          />
          <Script
            strategy="afterInteractive"
            src="https://umami.bi.status.im/script.js"
            data-website-id="144fa9a5-fe44-4bf3-a585-45742cfa89cc"
            data-domains="logos.co"
          />
        </head>
        <body>
          <SiteShell locale={locale}>{children}</SiteShell>
        </body>
      </html>
    </NextIntlClientProvider>
  )
}
