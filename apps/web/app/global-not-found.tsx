import '@/css/tailwind.css'

import type { Metadata, Viewport } from 'next'

import { NextIntlClientProvider } from 'next-intl'
import Script from 'next/script'

import { fontVariables } from '@/app/fonts'
import { NotFoundPage } from '@/components/not-found-page'
import SiteShell from '@/components/site-shell'
import siteConfig from '@/constants/site-config'
import { faviconIcons } from '@/lib/favicon'
import { themeInitScript } from '@/lib/theme'
import messages from '@/messages/en.json'

// Next.js adds `noindex` to not-found pages on its own; the title is ours to
// set, and without one the 404 document ships with no <title> at all.
export const metadata: Metadata = {
  title: `${messages.pages.notFound.code} — Page not found | ${siteConfig.name}`,
  icons: faviconIcons,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function GlobalNotFound() {
  const notFound = messages.pages.notFound

  return (
    <html
      lang="en"
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
        <NextIntlClientProvider locale="en" messages={messages}>
          <SiteShell locale="en">
            <NotFoundPage
              code={notFound.code}
              heading={notFound.heading}
              homeLink={notFound.homeLink}
            />
          </SiteShell>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
