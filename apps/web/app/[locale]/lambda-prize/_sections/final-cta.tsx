import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Cta } from './atoms'

export function FinalCta({
  copy,
}: {
  copy: LambdaPrizeCopySection['finalCta']
}) {
  return (
    <section className="lp-final" aria-labelledby="final-heading">
      <h2 id="final-heading" className="lp-display lp-display-large">
        {copy.heading}
      </h2>
      <div className="lp-actions">
        <Cta link={copy.primaryCta} />
        <Cta link={copy.secondaryCta} variant="secondary" />
      </div>
    </section>
  )
}
