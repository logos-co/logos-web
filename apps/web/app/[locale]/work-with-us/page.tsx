import { getTranslations } from 'next-intl/server'
import { LogosMark } from '@acid-info/logos-ui'
import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.workWithUs'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.workWithUs,
})

export default async function WorkWithUsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: NAMESPACE })
  return (
    <div className="px-3 pt-16 pb-12">
      <ContentWidth>
        <h1 className="text-h2 flex items-center gap-3 text-brand-dark-green">
          <LogosMark size={40} className="shrink-0" />
          {t('heading')}
        </h1>
      </ContentWidth>
    </div>
  )
}
