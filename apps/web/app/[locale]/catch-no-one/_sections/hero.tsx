import { HERO } from '../_content'

import { Column, Panel, Prose, TRIM } from './atoms'
import { TypewriterArmingScript, TypewriterHeadline } from './typewriter'

export function Hero() {
  return (
    <Panel className="bg-brand-off-white text-brand-dark-green">
      {/* Must stay above the headline: it runs while the parser is still here. */}
      <TypewriterArmingScript />
      <Column>
        <TypewriterHeadline
          className={`text-h2 ${TRIM}`}
          line1={HERO.headlineLine1}
          line2={HERO.headlineLine2}
        />
        <Prose>{HERO.intro}</Prose>
      </Column>
    </Panel>
  )
}
