import type { loadLambdaProgramme } from '@/lib/lambda-programme'

import { FeaturedPrizes } from './featured-prizes'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { OpenPrizes } from './open-prizes'
import { Ownership } from './ownership'
import { Resources } from './resources'
import { Rewarded } from './rewarded'
import { Rules } from './rules'

export function LambdaPrizePage({
  programme,
}: {
  programme: Awaited<ReturnType<typeof loadLambdaProgramme>>
}) {
  const { copy, cards, openCards, largest, openTotal, awardedCount } = programme
  const stats = {
    open: String(openCards.length),
    total: openTotal,
    largest: largest?.amount ?? openTotal,
    awarded: String(awardedCount),
  }
  return (
    <main className="lp-content">
      <Hero copy={copy.hero} stats={stats} />
      <FeaturedPrizes copy={copy.featured} prizes={cards} />
      <HowItWorks copy={copy.howItWorks} />
      <Rules copy={copy.rules} />
      <OpenPrizes
        copy={copy.openPrizes}
        prizes={cards}
        description={programme.openDescription}
      />
      <Ownership copy={copy.ownership} />
      <Rewarded
        copy={copy.rewarded}
        description={programme.awardedDescription}
      />
      <Resources copy={copy.resources} />
      <FinalCta copy={copy.finalCta} />
    </main>
  )
}
