import { ContentNotFoundError, getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'

import { MusterReveals } from './muster-reveals'
import { Architecture } from './_sections/architecture'
import { Basics } from './_sections/basics'
import { Build } from './_sections/build'
import { Closing } from './_sections/closing'
import { Cover } from './_sections/cover'
import { Modules } from './_sections/modules'
import { Prifi } from './_sections/prifi'
import { Rooms } from './_sections/rooms'
import './muster.css'

export const generateMetadata = createPageMetadata(ROUTES.muster)

export default async function MusterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`Unsupported Muster locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTES.muster, locale)
  const copy = page.sections.find(
    (section) => section.componentType === 'musterCopy'
  )
  if (!copy) throw new Error('Missing Muster case study copy')

  const nextCase = await getPageCopy(copy.closing.next.href, locale).catch(
    (error: unknown) => {
      if (error instanceof ContentNotFoundError) return null
      throw error
    }
  )

  return (
    <MusterReveals>
      <Cover hero={copy.hero} intro={copy.intro} />
      <Basics
        copy={copy.basics}
        brand={copy.hero.brand}
        project={copy.hero.project}
      />
      <Architecture copy={copy.architecture} />
      <Modules copy={copy.modules} />
      <Rooms copy={copy.rooms} />
      <Prifi copy={copy.prifi} />
      <Build copy={copy.build} />
      <Closing copy={copy.closing} nextAvailable={nextCase !== null} />
    </MusterReveals>
  )
}
