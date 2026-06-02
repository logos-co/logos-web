import { getPageCopy } from '@repo/content/loaders'
import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const locale = 'en'

type SectionContract = {
  componentType: string
  key: string
}

type PageContract = {
  route: string
  name: string
  sections: SectionContract[]
}

const contracts: PageContract[] = [
  {
    route: ROUTES.home,
    name: 'home',
    sections: [
      { componentType: 'hero', key: 'home.atf' },
      { componentType: 'techStackOverview', key: 'home.techStack' },
      { componentType: 'cardGrid', key: 'home.useCases' },
      { componentType: 'featuredText', key: 'home.parallelSocietyHeadline' },
      { componentType: 'gallery', key: 'home.parallelSociety' },
      { componentType: 'featuredText', key: 'home.mountain' },
      { componentType: 'relatedArticles', key: 'home.blog' },
      { componentType: 'featuredText', key: 'home.circlesCta' },
    ],
  },
  {
    route: ROUTES.technologyStack,
    name: 'technology-stack',
    sections: [
      { componentType: 'hero', key: 'techStack.hero' },
      { componentType: 'techStackOverview', key: 'techStack.overview' },
      { componentType: 'giantSwitch', key: 'techStack.appInstall' },
      { componentType: 'featuredText', key: 'techStack.modular' },
      { componentType: 'cardGrid', key: 'techStack.useCases' },
    ],
  },
  {
    route: ROUTES.blockchain,
    name: 'blockchain',
    sections: [
      { componentType: 'hero', key: 'blockchain.hero' },
      { componentType: 'ctaPanel', key: 'blockchain.privacy' },
      { componentType: 'cardGrid', key: 'blockchain.cryptarchia' },
      { componentType: 'cardGrid', key: 'blockchain.builderCta' },
      { componentType: 'relatedArticles', key: 'blockchain.relatedArticles' },
    ],
  },
  {
    route: ROUTES.networking,
    name: 'networking',
    sections: [
      { componentType: 'hero', key: 'networking.hero' },
      { componentType: 'ctaPanel', key: 'networking.intro' },
      { componentType: 'cardGrid', key: 'networking.features' },
      { componentType: 'cardGrid', key: 'networking.builderCta' },
      { componentType: 'relatedArticles', key: 'networking.relatedArticles' },
    ],
  },
  {
    route: ROUTES.messaging,
    name: 'messaging',
    sections: [
      { componentType: 'hero', key: 'messaging.hero' },
      { componentType: 'ctaPanel', key: 'messaging.privacy' },
      { componentType: 'ctaPanel', key: 'messaging.lmn' },
      { componentType: 'cardGrid', key: 'messaging.caseStudies' },
      { componentType: 'cardGrid', key: 'messaging.builderCta' },
      { componentType: 'relatedArticles', key: 'messaging.relatedArticles' },
    ],
  },
  {
    route: ROUTES.storage,
    name: 'storage',
    sections: [
      { componentType: 'hero', key: 'storage.hero' },
      { componentType: 'ctaPanel', key: 'storage.main' },
      { componentType: 'cardGrid', key: 'storage.builderCta' },
      { componentType: 'relatedArticles', key: 'storage.relatedArticles' },
    ],
  },
]

describe('content-backed web route contracts', () => {
  test.each(contracts)(
    '$name route has every section its page imports',
    async (contract) => {
      const page = await getPageCopy(contract.route, locale)
      const findSection = createSectionFinder(contract.name)

      for (const section of contract.sections) {
        expect(
          findSection(page.sections, section.componentType, section.key)
        ).toMatchObject(section)
      }
    }
  )

  test.each(contracts)(
    '$name metadata is generated from PageCopy SEO fields',
    async (contract) => {
      const page = await getPageCopy(contract.route, locale)
      const metadata = await createPageMetadata(contract.route)({
        params: Promise.resolve({ locale }),
      })

      expect(metadata.title).toBe(page.seo?.metaTitle ?? page.title)
      expect(metadata.description).toBe(
        page.seo?.metaDescription ?? page.description
      )
      expect(metadata.alternates?.canonical).toContain(contract.route)
    }
  )
})
