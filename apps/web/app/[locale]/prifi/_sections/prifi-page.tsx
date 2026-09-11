import { Credibility } from './credibility'
import { DeeperDives } from './deeper-dives'
import { ExploitBand } from './exploit-band'
import { Hazards } from './hazards'
import { Hero } from './hero'
import { Institutions } from './institutions'
import { LogosStack } from './logos-stack'
import { SupplyChain } from './supply-chain'

export function PriFiPage() {
  return (
    <div className="overflow-x-clip bg-brand-off-white text-brand-dark-green">
      {/* The page stays dark well past the first viewport, so the header
          keeps its light ink until these sections scroll away
          (see lib/header-tone.ts). */}
      <div data-header-tone="dark">
        <Hero />
        <SupplyChain />
        <ExploitBand />
      </div>
      <Hazards />
      <Credibility />
      <LogosStack />
      <Institutions />
      <DeeperDives />
    </div>
  )
}
