import { getTranslations } from 'next-intl/server'

import { ROUTES } from '@/constants/routes'

export default async function GlobalNotFound() {
  const t = await getTranslations({ locale: 'en', namespace: 'pages.notFound' })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-3 py-20">
      <h1 className="text-4xl font-light text-gray-500">{t('heading')}</h1>
      <a
        href={ROUTES.home}
        className="cursor-pointer border-b border-brand-dark-green/50 pb-0.5 font-mono text-xs font-semibold uppercase leading-[1.35] text-brand-dark-green transition-opacity hover:opacity-70"
      >
        {t('homeLink')}
      </a>
    </main>
  )
}
