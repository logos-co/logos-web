import { getTranslations } from 'next-intl/server'
import { twMerge } from 'tailwind-merge'

import { getPageCopy } from '@repo/content/loaders'
import type { Language, TechStackOverviewSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal, RevealItem } from '@/components/motion/reveal'
import { ROUTES } from '@/constants/routes'
import { createSectionFinder } from '@/lib/page-sections'

import { TechStackDiagram } from './tech-stack-diagram'

const findTechnologyStackSection = createSectionFinder('technology-stack')

export default async function TechStackExplorer({
  locale,
  contentClassName,
}: {
  locale: Language
  contentClassName?: string
}) {
  const t = await getTranslations({
    locale,
    namespace: 'pages.technologyStack.stack',
  })
  const page = await getPageCopy(ROUTES.technologyStack, locale)
  const overview = findTechnologyStackSection<TechStackOverviewSection>(
    page.sections,
    'techStackOverview',
    'techStack.overview'
  )

  return (
    <section className="border-brand-dark-green/10 bg-brand-off-white border-t">
      <ContentWidth
        className={twMerge('pt-25 pb-29.5 md:pb-6', contentClassName)}
      >
        <Reveal
          stagger
          className="flex flex-col gap-3 text-brand-dark-green md:flex-row md:gap-0"
        >
          <RevealItem className="md:w-178.5">
            <h2 className="text-h4-sans">
              {t('titleLine1')}
              <br />
              {t('titleLine2')}
            </h2>
          </RevealItem>
          <RevealItem className="md:w-83.5">
            <p className="text-mono-s">{t('body')}</p>
          </RevealItem>
        </Reveal>

        <TechStackDiagram
          data={overview}
          networkingHref={ROUTES.networking}
          foundationHref={ROUTES.technologyStack}
          className="mt-15 md:mt-25"
        />
      </ContentWidth>
    </section>
  )
}
