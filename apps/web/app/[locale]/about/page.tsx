import { getTranslations } from 'next-intl/server'

import {
  AboutCommunity,
  AboutHero,
  AboutInitiative,
  AboutOurWork,
  AboutWhoWeAre,
} from '@/components/sections/about'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.about' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.about,
  })
}

export default async function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutCommunity />
      <AboutInitiative />
      <AboutWhoWeAre />
      <AboutOurWork />
    </>
  )
}
