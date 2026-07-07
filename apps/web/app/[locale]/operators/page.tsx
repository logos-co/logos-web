import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { OperatorsCopySection } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'
import { getLegalDoc } from '@/lib/legal-content'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { OperatorsLegalTabs } from './operators-legal-tabs'

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
    'operators.copy'
  )
  const terms = getLegalDoc(data.documents.terms.slug)
  const privacy = getLegalDoc(data.documents.privacy.slug)
  const disclaimer = getLegalDoc(data.documents.disclaimer.slug)

  return (
    <main className="bg-brand-off-white text-brand-dark-green">
      <section className="border-y border-brand-dark-green/15 bg-gray-01 py-24 md:py-32">
        <ContentWidth>
          <div className="mx-auto grid max-w-[1020px] gap-12 md:grid-cols-12 md:gap-3">
            <div className="flex items-start gap-3 md:col-span-3">
              <LogosMark size={24} className="mt-0.5 shrink-0" />
              <p className="font-mono text-[18px] leading-[1.35] md:text-[22px]">
                {data.banner.title}
              </p>
            </div>
            <h1 className="text-body-sans leading-[1.5] md:col-span-8 md:col-start-5 md:text-[16px]">
              {data.banner.body}
            </h1>
          </div>
        </ContentWidth>
      </section>
      <OperatorsLegalTabs
        terms={{ label: data.documents.terms.label, body: terms.body }}
        privacy={{ label: data.documents.privacy.label, body: privacy.body }}
        disclaimer={{
          label: data.documents.disclaimer.label,
          body: disclaimer.body,
        }}
      />
    </main>
  )
}
