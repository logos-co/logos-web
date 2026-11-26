import './node-referral-programme.css'

import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'

import { CaseStudyMotion } from '@/components/case-study-motion'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { NodeProgrammeBasecamp } from './_sections/basecamp'
import { NodeProgrammeFaqs } from './_sections/faqs'
import { NodeProgrammeHero } from './_sections/hero'

const findSection = createSectionFinder('logos-node-referral-programme')

export const generateMetadata = createPageMetadata(ROUTES.nodeReferralProgramme)

export default async function NodeProgrammePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`NodeProgrammePage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTES.nodeReferralProgramme, locale)
  const data = findSection<NodeReferralProgrammeCopySection>(
    page.sections,
    'nodeReferralProgrammeCopy',
    'nodeReferralProgramme.copy'
  )

  return (
    <CaseStudyMotion
      className="node-referral-programme bg-brand-off-white text-brand-dark-green"
      revealContent
    >
      <NodeProgrammeHero hero={data.hero} signup={data.signup} />
      <NodeProgrammeBasecamp data={data.basecamp} />
      <NodeProgrammeFaqs data={data.faqs} />
    </CaseStudyMotion>
  )
}
