import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { getHomeTechStackOverview } from '@/lib/tech-stack-overview'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { LambdaPrizePage } from './_sections/lambda-prize-page'

const ROUTE = ROUTES.lambdaPrize

const findSection = createSectionFinder('lambda-prize')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`LambdaPrizePage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)
  const techStack = await getHomeTechStackOverview(locale)

  const data = findSection<LambdaPrizeCopySection>(
    page.sections,
    'lambdaPrizeCopy',
    'lambdaPrize.copy',
  )

  return (
    <LambdaPrizePage
      techStack={techStack}
      copy={{
        hero: data.hero,
        howItWorks: data.howItWorks,
        evaluation: data.evaluation,
        featured: {
          heading: data.featured.heading,
          prizes: data.featured.prizes.map((prize) => ({
            meta: [prize.meta.id, prize.meta.effort, prize.meta.prize],
            title: prize.title,
            body: prize.body,
            status: data.featured.status,
            href: prize.url,
          })),
        },
        about: data.about,
        techStack: data.techStack,
        support: data.support,
      }}
    />
  )
}
