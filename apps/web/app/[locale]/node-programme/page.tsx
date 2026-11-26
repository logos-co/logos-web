import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { NodeProgrammeCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { NodeProgrammeBasecamp } from './_sections/basecamp'
import { NodeProgrammeFaqs } from './_sections/faqs'
import { NodeProgrammeHero } from './_sections/hero'

const findSection = createSectionFinder('node-programme')

export const generateMetadata = createPageMetadata(ROUTES.nodeProgramme)

export default async function NodeProgrammePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`NodeProgrammePage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTES.nodeProgramme, locale)
  const data = findSection<NodeProgrammeCopySection>(
    page.sections,
    'nodeProgrammeCopy',
    'nodeProgramme.copy'
  )

  return (
    <div className="bg-brand-off-white text-brand-dark-green">
      <NodeProgrammeHero hero={data.hero} signup={data.signup} />
      <NodeProgrammeBasecamp data={data.basecamp} />
      <NodeProgrammeFaqs data={data.faqs} />
    </div>
  )
}
