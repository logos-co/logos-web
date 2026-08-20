import { HERO } from '../_content'

import { Column, Panel, Prose, TRIM } from './atoms'
import { HeroHeadline } from './typewriter'

/**
 * Set to true to type the headline in on load. Off today: the typewriter is
 * reserved for the quote cards.
 */
const ANIMATE_HEADLINE = false

export function Hero() {
  return (
    <Panel className="bg-brand-off-white text-brand-dark-green">
      <Column>
        <HeroHeadline
          animate={ANIMATE_HEADLINE}
          className={`text-h2 ${TRIM}`}
          line1={HERO.headlineLine1}
          line2={HERO.headlineLine2}
        />
        <Prose>{HERO.intro}</Prose>
      </Column>
    </Panel>
  )
}
