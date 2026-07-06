import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { DesignGuideCopySection } from '@repo/content/schemas'

import { DocsPageShell } from '@/components/sections/shared/docs-page-shell'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.designGuide
const findSection = createSectionFinder('design-guide')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function DesignGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`DesignGuidePage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)
  const copy = findSection<DesignGuideCopySection>(
    page.sections,
    'designGuideCopy',
    'designGuide.copy'
  )

  return (
    <DocsPageShell activeKey="designGuide">
      <h1 className="text-eyebrow w-full text-brand-dark-green">
        {copy.heading}
      </h1>

      <p className="text-mono-s w-full text-brand-dark-green">{copy.intro}</p>

      <a
        href={copy.downloads.brandMarks.href}
        download
        className="text-eyebrow inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-gray-01 px-3 py-3 text-brand-dark-green"
      >
        {copy.downloads.brandMarks.label}
      </a>

      <p className="text-eyebrow w-full pt-3 text-brand-dark-green">
        {copy.downloads.guidelinesSection}
      </p>

      <a
        href={copy.downloads.guidelines.href}
        download
        className="text-eyebrow inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-gray-01 px-3 py-3 text-brand-dark-green"
      >
        {copy.downloads.guidelines.label}
      </a>
    </DocsPageShell>
  )
}
