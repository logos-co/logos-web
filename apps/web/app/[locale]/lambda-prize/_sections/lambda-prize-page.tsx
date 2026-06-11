import type { TechStackOverviewSection } from '@repo/content/schemas'

import TechStackSection from '@/components/sections/home/tech-stack-section'
import { ROUTES } from '@/constants/routes'

import { AboutProgramme } from './about-programme'
import { FeaturedPrizes } from './featured-prizes'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { Support } from './support'
import type { LambdaPrizePageCopy } from './types'

interface LambdaPrizePageProps {
  copy: LambdaPrizePageCopy
  techStack: TechStackOverviewSection
}

export function LambdaPrizePage({ copy, techStack }: LambdaPrizePageProps) {
  return (
    <main className="overflow-hidden bg-brand-off-white">
      <Hero copy={copy.hero} />
      <HowItWorks copy={copy.howItWorks} evaluation={copy.evaluation} />
      <FeaturedPrizes copy={copy.featured} />
      <AboutProgramme copy={copy.about} />
      <TechStackSection
        data={techStack}
        networkingHref={ROUTES.networking}
        foundationHref={ROUTES.technologyStack}
        desktopAt1367
        borderTop={false}
      />
      <Support copy={copy.support} />
    </main>
  )
}
