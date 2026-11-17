import { isActiveLocale } from '@repo/content/locales'

import { JsonLd } from '@/components/seo/json-ld'
import { ROUTES } from '@/constants/routes'
import siteConfig from '@/constants/site-config'
import { createPageMetadata } from '@/lib/page-metadata'
import { loadRfpProgramme } from '@/lib/rfp-programme'
import { createBreadcrumbListJsonLd } from '@/lib/structured-data'

import { programmeMono } from '../developer-programmes/fonts'
import { After } from './_sections/after'
import { Applicants } from './_sections/applicants'
import { Deliverables } from './_sections/deliverables'
import { FinalCta } from './_sections/final-cta'
import { Hero } from './_sections/hero'
import { HowItWorks } from './_sections/how-it-works'
import { OpenRfps } from './_sections/open-rfps'
import { Terms } from './_sections/terms'
import { Tiers } from './_sections/tiers'
import './rfp.css'
import './mobile.css'

export const generateMetadata = createPageMetadata(ROUTES.rfps)

export default async function RfpsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`RfpsPage received non-active locale "${locale}"`)
  const { copy, items } = await loadRfpProgramme(locale)
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
