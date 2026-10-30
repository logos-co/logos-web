import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { FeaturedPrizes } from './featured-prizes'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { OpenPrizes } from './open-prizes'
import { Ownership } from './ownership'
import { Resources } from './resources'
import { Rewarded } from './rewarded'
import { Rules } from './rules'

export function LambdaPrizePage({ copy }: { copy: LambdaPrizeCopySection }) {
  return (
    <main className="lp-content">
      <Hero copy={copy.hero} />
      <FeaturedPrizes copy={copy.featured} prizes={copy.prizes} />
      <HowItWorks copy={copy.howItWorks} />
      <Rules copy={copy.rules} />
      <OpenPrizes copy={copy.openPrizes} prizes={copy.prizes} />
      <Ownership copy={copy.ownership} />
      <Rewarded copy={copy.rewarded} />
      <Resources copy={copy.resources} />
      <FinalCta copy={copy.finalCta} />
    </main>
  )
}
