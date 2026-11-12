import { Newsreader } from 'next/font/google'
import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'

import { RailgunMotion } from './_motion/railgun-motion'
import { Basics } from './_sections/basics'
import { Build } from './_sections/build'
import { Closing } from './_sections/closing'
import { RailgunFooter } from './_sections/footer'
import { Gateway } from './_sections/gateway'
import { Hero } from './_sections/hero'
import { Intro } from './_sections/intro'
import { Privacy } from './_sections/privacy'
import { Prifi } from './_sections/prifi'
import { Production } from './_sections/production'
import { Stack } from './_sections/stack'
import { Transaction } from './_sections/transaction'
import './railgun.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['opsz'],
  display: 'swap',
  variable: '--railgun-font-newsreader',
})

export const generateMetadata = createPageMetadata(ROUTES.railgun)

export default async function RailgunPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`Unsupported Railgun locale "${locale}"`)

  const page = await getPageCopy(ROUTES.railgun, locale)
  const copy = page.sections.find(
    (section) => section.componentType === 'railgunCopy'
  )
  if (!copy) throw new Error('Missing Railgun case study copy')

  return (
    <RailgunMotion className={newsreader.variable}>
      <Hero copy={copy.hero} />
      <div className="sheet">
        <Intro copy={copy.intro} />
        <Basics copy={copy.basics} />
        <Privacy copy={copy.privacy} />
        <Transaction copy={copy.transaction} />
        <Stack copy={copy.stack} />
        <Production copy={copy.production} />
        <Prifi copy={copy.prifi} />
        <Build copy={copy.build} />
        <Closing copy={copy.closing} />
        <div data-header-tone="dark">
          <RailgunFooter copy={copy.footer} locale={locale} />
        </div>
      </div>
      <Gateway copy={copy.gateway} />
    </RailgunMotion>
  )
}
