import '@/css/tailwind.css'

import { themeInitScript } from '@/lib/theme'
import { fontVariables } from '@/app/fonts'
import PageTransition from '@/components/page-transition'
import ScrollToTop from '@/components/scroll-to-top'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { routing } from '@/i18n/routing'

import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export const dynamicParams = false

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
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
          <meta name="msapplication-TileColor" content="#000000" />
          <meta
            name="theme-color"
            media="(prefers-color-scheme: light)"
            content="#fff"
          />
          <meta
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content="#000"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: themeInitScript,
            }}
          />
        </head>
        <body>
          <ScrollToTop />
          <SiteHeader locale={locale} />
          <main className="relative">
            <PageTransition>{children}</PageTransition>
          </main>
          <SiteFooter locale={locale} />
        </body>
      </html>
    </NextIntlClientProvider>
  )
}
