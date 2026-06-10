import { getCircleInitiatives, getPageCopy } from '@repo/content/loaders'
import { describe, expect, test } from 'vitest'

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import messages from '../../messages/en.json' with { type: 'json' }

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
  test('movement page initiative cards use the current winnable issues', async () => {
    const initiatives = await getCircleInitiatives({
      locale,
      status: 'published',
    })

    expect(
      initiatives.slice(0, 3).map((initiative) => ({
        locationLabel: initiative.locationLabel,
        title: initiative.title,
        description: initiative.description,
        href: initiative.href,
      }))
    ).toEqual([
      {
        locationLabel: 'Los Angeles, California',
        title: 'Logos-powered Nextdoor App',
        description:
          "Build a neighbourhood-scale messaging surface that doesn't sell its members to advertisers. The LA Circle is prototyping a Nextdoor-style app on top of Waku and Codex with strict membership scoping per block.",
        href: 'https://circles.logos.co/readme/about-logos-circles/winnable-issues-from-circles#los-angeles',
      },
      {
        locationLabel: 'Benin',
        title: 'Social-DeFi Fundraising',
        description:
          'Build a "Social DeFi" platform that combines the engagement of social media with a regenerative financial engine. FundBrave replaces traditional donations with a high-yield fundraising model for community action.',
        href: 'https://circles.logos.co/readme/about-logos-circles/winnable-issues-from-circles#benin',
      },
      {
        locationLabel: 'London',
        title: 'Digital IDs Knowledge Hub',
        description:
          'Build a clear, accessible information hub to help UK citizens understand digital IDs, the risks, benefits, and alternatives, without government or media spin. The hub will include articles, explainers, videos, and translatable content for local organisers.',
        href: 'https://circles.logos.co/readme/about-logos-circles/winnable-issues-from-circles#london',
      },
    ])
  })

  test('movement page builder highlight uses the Benin fundraising issue', () => {
    const builder = messages.pages.movement.builder

    expect(builder.feature).toEqual({
      city: 'Benin',
      title: 'Regenerative Social DeFi Fundraising Platform',
      cta: 'View issue',
    })
    expect(builder.details).toEqual({
      problem: {
        label: 'Problem',
        body: 'Grassroots projects in Benin struggle to access funding due to low trust in traditional charity platforms, limited transparency, and a focus on short-term donations.',
      },
      solution: {
        label: 'Solution',
        body: 'Build a regenerative fundraising platform where users support local causes through yield-generating staking, transparent governance, and community-driven funding allocation.',
      },
      stack: {
        label: 'Stack',
        body: 'React, Node.js, Aave/Morpho, Logos Messaging, Status, tokenised RWAs, DAO governance, and privacy-preserving identity.',
      },
    })
    expect(EXTERNAL_URLS.circlesWinnableIssueBenin).toBe(
      'https://circles.logos.co/readme/about-logos-circles/winnable-issues-from-circles#benin'
    )
  })

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
