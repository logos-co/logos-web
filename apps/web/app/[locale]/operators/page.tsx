import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { OperatorsCopySection } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.operators

const findSection = createSectionFinder('operators')

export const generateMetadata = createPageMetadata(ROUTE)

interface OperatorsPageProps {
  params: Promise<{ locale: string }>
}

export default async function OperatorsPage({ params }: OperatorsPageProps) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`OperatorsPage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)

  const data = findSection<OperatorsCopySection>(
    page.sections,
    'operatorsCopy',
    'operators.copy',
  )

  return (
    <main className="bg-brand-off-white text-brand-dark-green">
      <section className="border-y border-brand-dark-green/15 bg-brand-yellow py-24 md:py-32">
        <ContentWidth>
          <div className="mx-auto grid max-w-[1020px] gap-12 md:grid-cols-12 md:gap-3">
            <div className="flex items-start gap-3 md:col-span-3">
              <LogosMark size={12} />
              <p className="text-mono-s">{data.banner.title}</p>
            </div>
            <h1 className="text-h3 md:col-span-8 md:col-start-5">
              {data.banner.body}
            </h1>
          </div>
        </ContentWidth>
      </section>
    </main>
  )
}
