import { getTranslations } from 'next-intl/server'

import ResearchPageView from '@/components/sections/research/research-page'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.research' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.research,
  })
}

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <ResearchPageView locale={locale} />
}
