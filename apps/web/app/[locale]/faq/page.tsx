import { getTranslations } from 'next-intl/server'

import { FaqSection } from '@/components/sections/faq'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.faq' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.faq,
  })
}

export default async function FaqPage() {
  return <FaqSection />
}
