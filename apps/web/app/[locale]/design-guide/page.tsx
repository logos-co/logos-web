import { getTranslations } from 'next-intl/server'

import { DocsPageShell } from '@/components/sections/shared/docs-page-shell'
import { ROUTES } from '@/constants/routes'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.brandKit'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.brandKit,
})

export default async function BrandKitPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: NAMESPACE })

  return (
    <DocsPageShell activeKey="brandKit">
      <h1 className="text-eyebrow w-full text-brand-dark-green">
        {t('heading')}
      </h1>

      <p className="text-mono-s w-full text-brand-dark-green">{t('intro')}</p>

      <a
        href={t('downloads.brandMarksHref')}
        download
        className="text-eyebrow inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-gray-01 px-3 py-3 text-brand-dark-green"
      >
        {t('downloads.brandMarksLabel')}
      </a>

      <p className="text-eyebrow w-full pt-3 text-brand-dark-green">
        {t('downloads.guidelinesSection')}
      </p>

      <a
        href={t('downloads.guidelinesHref')}
        download
        className="text-eyebrow inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-gray-01 px-3 py-3 text-brand-dark-green"
      >
        {t('downloads.guidelinesLabel')}
      </a>
    </DocsPageShell>
  )
}
