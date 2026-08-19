import { notFound } from 'next/navigation'

import { getActiveLocales } from '@repo/content/locales'
import {
  getBuilderHubListingSettings,
  getPageCopy,
} from '@repo/content/loaders'

import { BuildersHubDetailLayout } from '@/components/sections/builders-hub/builders-hub-detail-layout'
import { JsonLd } from '@/components/seo/json-ld'
import { LegalMarkdown } from '@/components/sections/shared/legal-markdown'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import siteConfig from '@/constants/site-config'
import { createDefaultMetadata } from '@/lib/metadata'
import { resolveLocale, type LocaleSlugParams } from '@/lib/route-params'
import {
  RFP_APPLY_URL,
  fetchGithubRfpBySlug,
  fetchGithubRfps,
  stripLeadingHeading,
} from '@/lib/rfps-github'
import { createBreadcrumbListJsonLd } from '@/lib/structured-data'

export async function generateStaticParams() {
  const rfps = await fetchGithubRfps()
  const params: Array<{ locale: string; slug: string }> = []
  for (const locale of getActiveLocales()) {
    for (const rfp of rfps) params.push({ locale, slug: rfp.slug })
  }
  return params
}

export async function generateMetadata({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'generateMetadata')
  const { slug } = await params
  const rfp = await fetchGithubRfpBySlug(slug)
  if (!rfp) {
    return createDefaultMetadata({
      title: 'RFP not found',
      description: 'This RFP does not exist or has not been published yet.',
      locale,
      path: `${ROUTES.rfps}/${slug}`,
    })
  }
  return createDefaultMetadata({
    title: rfp.title,
    description: rfp.summary,
    locale,
    path: `${ROUTES.rfps}/${slug}`,
  })
}

export default async function RfpDetailPage({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'RfpDetailPage')
  const { slug } = await params

  const rfp = await fetchGithubRfpBySlug(slug)
  if (!rfp) notFound()

  const [buildersHub, listingSettings] = await Promise.all([
    getPageCopy(ROUTES.buildersHub, locale),
    getBuilderHubListingSettings({ page: 'rfps', locale }),
  ])

  const meta = [
    { label: 'Status', value: rfp.status },
    rfp.category ? { label: 'Category', value: rfp.category } : null,
    rfp.tier ? { label: 'Tier', value: rfp.tier } : null,
  ].filter((x): x is { label: string; value: string } => Boolean(x))

  return (
    <>
      <JsonLd
        data={createBreadcrumbListJsonLd(
          [
            { name: siteConfig.name, path: ROUTES.home },
            {
              name: buildersHub.heading ?? buildersHub.title,
              path: ROUTES.buildersHub,
            },
            { name: listingSettings.breadcrumbLabel, path: ROUTES.rfps },
            { name: rfp.title, path: `${ROUTES.rfps}/${slug}` },
          ],
          locale
        )}
      />
      <BuildersHubDetailLayout
        backHref={ROUTES.rfps}
        backLabel="All RFPs"
        eyebrow={`${rfp.number} · ${rfp.status}`}
        title={rfp.title}
        tagline={rfp.summary}
        body={<LegalMarkdown body={stripLeadingHeading(rfp.rawMarkdown)} />}
        primaryCta={{
          label: 'Apply',
          href: RFP_APPLY_URL,
          external: true,
        }}
        meta={meta}
        footer={
          <Button href={rfp.githubUrl} variant="secondary">
            View on GitHub
          </Button>
        }
      />
    </>
  )
}
