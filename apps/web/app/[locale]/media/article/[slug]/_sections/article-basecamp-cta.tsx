import { useTranslations } from 'next-intl'

import { BasecampCta } from '@/components/sections/basecamp/_sections/basecamp-cta'
import { EXTERNAL_URLS } from '@/constants/routes'

export function ArticleBasecampCta() {
  const t = useTranslations('mediaDetail.article')

  return (
    <section aria-label={t('installBasecamp')}>
      <BasecampCta
        cta={{
          label: t('installBasecamp'),
          href: EXTERNAL_URLS.basecampRelease,
        }}
        eventName="Install Basecamp - Article"
        className="cursor-pointer"
      />
    </section>
  )
}
