import '@/css/tailwind.css'

import { NextIntlClientProvider } from 'next-intl'

import { fontVariables } from '@/app/fonts'
import { NotFoundPage } from '@/components/not-found-page'
import SiteShell from '@/components/site-shell'
import messages from '@/messages/en.json'

export default function GlobalNotFound() {
  const notFound = messages.pages.notFound

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className={fontVariables}>
        <SiteShell locale="en">
          <NotFoundPage
            code={notFound.code}
            heading={notFound.heading}
            homeLink={notFound.homeLink}
          />
        </SiteShell>
      </div>
    </NextIntlClientProvider>
  )
}
