import { getTranslations } from 'next-intl/server'

import { NotFoundPage } from '@/components/not-found-page'

export default async function NotFound() {
  const t = await getTranslations('pages.notFound')

  return (
    <NotFoundPage
      code={t('code')}
      heading={t('heading')}
      homeLink={t('homeLink')}
    />
  )
}
