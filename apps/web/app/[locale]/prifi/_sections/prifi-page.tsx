import type { PrifiCopySection } from '@repo/content/schemas'

import { Credibility } from './credibility'
import { DeeperDives } from './deeper-dives'
import { ExploitBand } from './exploit-band'
import { Hazards } from './hazards'
import { Hero } from './hero'
import { Institutions } from './institutions'
import { LogosStack } from './logos-stack'
import { SupplyChain } from './supply-chain'

export function PriFiPage({ copy }: { copy: PrifiCopySection }) {
  return (
    <div className="overflow-x-clip bg-brand-off-white text-brand-dark-green">
      {/* The page stays dark well past the first viewport, so the header
          keeps its light ink until these sections scroll away
          (see lib/header-tone.ts). */}
      <div data-header-tone="dark">
        <Hero copy={copy.hero} />
        <SupplyChain copy={copy.supplyChain} />
        <ExploitBand copy={copy.exploitBand} />
      </div>
      <Hazards hazards={copy.hazards} protection={copy.protection} />
      <Credibility
        transparency={copy.transparency}
        credibility={copy.credibility}
        imperativeCommitments={copy.imperativeCommitments}
      />
      <LogosStack copy={copy.logosStack} />
      <Institutions copy={copy.institutions} />
      <DeeperDives copy={copy.deeperDives} />
    </div>
  )
}
