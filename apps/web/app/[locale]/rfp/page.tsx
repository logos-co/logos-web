import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { RfpProgrammeCopySection } from '@repo/content/schemas'

import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import siteConfig from '@/constants/site-config'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'
import { fetchGithubRfps } from '@/lib/rfps-github'
import { createBreadcrumbListJsonLd } from '@/lib/structured-data'

import { programmeMono } from '../developer-programmes/fonts'
import { After } from './_sections/after'
import { Applicants } from './_sections/applicants'
import { Deliverables } from './_sections/deliverables'
import { FinalCta } from './_sections/final-cta'
import { Hero } from './_sections/hero'
import { HowItWorks } from './_sections/how-it-works'
import { OpenRfps } from './_sections/open-rfps'
import { programmeItems } from './_sections/rfp-items'
import { Terms } from './_sections/terms'
import { Tiers } from './_sections/tiers'
import './rfp.css'
import './mobile.css'

export const generateMetadata = createPageMetadata(ROUTES.rfps)
const findSection = createSectionFinder('rfp')

export default async function RfpsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`RfpsPage received non-active locale "${locale}"`)
  const [page, rfps] = await Promise.all([
    getPageCopy(ROUTES.rfps, locale),
    fetchGithubRfps(),
  ])
  const copy = findSection<RfpProgrammeCopySection>(
    page.sections,
    'rfpProgrammeCopy',
    'rfp.copy'
  )
  const items = programmeItems(rfps)
  return (
    <div className={`rfp-programme ${programmeMono.variable}`}>
      <JsonLd
        data={createBreadcrumbListJsonLd(
          [
            { name: siteConfig.name, path: ROUTES.home },
            {
              name: copy.hero.breadcrumb.label,
              path: ROUTES.developerProgrammes,
            },
            { name: copy.hero.breadcrumbCurrent, path: ROUTES.rfps },
          ],
          locale
        )}
      />
      <Hero copy={copy.hero} listing={copy.listing} items={items} />
      <HowItWorks copy={copy.howItWorks} />
      <Tiers copy={copy.tiers} />
      <OpenRfps copy={copy.listing} items={items} />
      <Deliverables copy={copy.deliverables} />
      <Applicants copy={copy.applicants} />
      <Terms copy={copy.terms} />
      <After copy={copy.after} />
      <FinalCta copy={copy.finalCta} />
    </div>
  )
}
