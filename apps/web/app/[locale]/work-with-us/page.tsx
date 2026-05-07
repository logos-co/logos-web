import { getTranslations } from 'next-intl/server'
import { LogosMark } from '@repo/ui'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.workWithUs' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.workWithUs,
  })
}

export default async function WorkWithUsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.workWithUs' })
  return (
    <div className="px-3 pt-16 pb-12">
      <h1 className="text-h2 flex items-center gap-3 text-brand-dark-green">
        <LogosMark size={40} className="shrink-0" />
        {t('heading')}
      </h1>
    </div>
  )
}
