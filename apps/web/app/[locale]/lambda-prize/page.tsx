import { getTranslations } from 'next-intl/server'

import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { getHomeTechStackOverview } from '@/lib/tech-stack-overview'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

import { LambdaPrizePage } from './_sections/lambda-prize-page'

const NAMESPACE = 'pages.lambdaPrize'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.lambdaPrize,
})

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`LambdaPrizePage received non-active locale "${locale}"`)
  }
  const t = await getTranslations({ locale, namespace: NAMESPACE })
  const techStack = await getHomeTechStackOverview(locale)

  return (
    <LambdaPrizePage
      techStack={techStack}
      copy={{
        hero: {
          label: t('hero.label'),
          heading: t('hero.heading'),
          body: t('hero.body'),
          primaryCta: t('hero.primaryCta'),
          secondaryCta: t('hero.secondaryCta'),
        },
        howItWorks: {
          heading: t('howItWorks.heading'),
          rows: [
            {
              label: t('howItWorks.rows.1.label'),
              body: t('howItWorks.rows.1.body'),
            },
            {
              label: t('howItWorks.rows.2.label'),
              body: t('howItWorks.rows.2.body'),
            },
            {
              label: t('howItWorks.rows.3.label'),
              body: t('howItWorks.rows.3.body'),
            },
            {
              label: t('howItWorks.rows.4.label'),
              body: t('howItWorks.rows.4.body'),
            },
            {
              label: t('howItWorks.rows.5.label'),
              body: t('howItWorks.rows.5.body'),
            },
            {
              label: t('howItWorks.rows.6.label'),
              body: t('howItWorks.rows.6.body'),
            },
          ],
        },
        evaluation: {
          heading: t('evaluation.heading'),
          rows: [
            {
              label: t('evaluation.rows.1.label'),
              body: t('evaluation.rows.1.body'),
            },
            {
              label: t('evaluation.rows.2.label'),
              body: t('evaluation.rows.2.body'),
            },
          ],
          primaryCta: t('evaluation.primaryCta'),
          secondaryCta: t('evaluation.secondaryCta'),
        },
        featured: {
          heading: t('featured.heading'),
          prizes: [
            {
              meta: [
                t('featured.prizes.1.meta.id'),
                t('featured.prizes.1.meta.effort'),
                t('featured.prizes.1.meta.prize'),
              ],
              title: t('featured.prizes.1.title'),
              body: t('featured.prizes.1.body'),
              status: t('featured.status'),
            },
            {
              meta: [
                t('featured.prizes.2.meta.id'),
                t('featured.prizes.2.meta.effort'),
                t('featured.prizes.2.meta.prize'),
              ],
              title: t('featured.prizes.2.title'),
              body: t('featured.prizes.2.body'),
              status: t('featured.status'),
            },
            {
              meta: [
                t('featured.prizes.3.meta.id'),
                t('featured.prizes.3.meta.effort'),
                t('featured.prizes.3.meta.prize'),
              ],
              title: t('featured.prizes.3.title'),
              body: t('featured.prizes.3.body'),
              status: t('featured.status'),
            },
          ],
        },
        about: {
          heading: t('about.heading'),
          body: t('about.body'),
          primaryCta: t('about.primaryCta'),
          secondaryCta: t('about.secondaryCta'),
          rows: [
            {
              label: t('about.rows.1.label'),
              body: t('about.rows.1.body'),
            },
            {
              label: t('about.rows.2.label'),
              body: t('about.rows.2.body'),
            },
            {
              label: t('about.rows.3.label'),
              body: t('about.rows.3.body'),
            },
          ],
        },
        support: {
          heading: t('support.heading'),
          body: t('support.body'),
          cta: t('support.cta'),
          rows: [
            {
              label: t('support.rows.1.label'),
              body: t('support.rows.1.body'),
              action: t('support.rows.1.action'),
            },
            {
              label: t('support.rows.2.label'),
              body: t('support.rows.2.body'),
              action: t('support.rows.2.action'),
            },
            {
              label: t('support.rows.3.label'),
              body: t('support.rows.3.body'),
              action: t('support.rows.3.action'),
            },
            {
              label: t('support.rows.4.label'),
              body: t('support.rows.4.body'),
              action: t('support.rows.4.action'),
            },
          ],
        },
      }}
    />
  )
}
