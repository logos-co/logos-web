import { getTranslations } from 'next-intl/server'

import { NotFoundPage } from '@/components/not-found-page'

export default async function NotFound() {
  const t = await getTranslations('pages.notFound')

  return (
    <NotFoundPage
      code={t('code')}
      eyebrow={t('eyebrow')}
      status={t('status')}
      heading={t('heading')}
      description={t('description')}
      homeLink={t('homeLink')}
    />
  )
}
