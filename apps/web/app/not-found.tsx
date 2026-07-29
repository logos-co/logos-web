import '@/css/tailwind.css'

import { NextIntlClientProvider } from 'next-intl'

import { fontVariables } from '@/app/fonts'
import { NotFoundPage } from '@/components/not-found-page'
import { Providers } from '@/components/providers'
import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import messages from '@/messages/en.json'

export default function GlobalNotFound() {
  const notFound = messages.pages.notFound

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className={fontVariables}>
        <Providers>
          <SiteHeader locale="en" />
          <main className="relative">
            <NotFoundPage
              code={notFound.code}
              eyebrow={notFound.eyebrow}
              status={notFound.status}
              heading={notFound.heading}
              description={notFound.description}
              homeLink={notFound.homeLink}
            />
          </main>
          <SiteFooter locale="en" />
        </Providers>
      </div>
    </NextIntlClientProvider>
  )
}
