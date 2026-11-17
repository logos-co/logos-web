import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Cta } from './atoms'

export function Rewarded({
  copy,
  description,
}: {
  copy: LambdaPrizeCopySection['rewarded']
  description: string
}) {
  return (
    <section
      id="already-rewarded"
      className="lp-rewarded"
      aria-labelledby="rewarded-heading"
    >
      <div className="lp-rewarded-intro">
        <p className="lp-eyebrow">{copy.eyebrow}</p>
        <h2 id="rewarded-heading" className="lp-display lp-display-medium">
          {copy.heading}
        </h2>
        <p className="lp-body">{description}</p>
        <Cta link={copy.cta} variant="secondary" />
      </div>
      <ul className="lp-solutions">
        {copy.solutions.map((solution) => (
          <li key={solution.id}>
            <p className="lp-eyebrow lp-solution-id">{solution.id}</p>
            <div>
              <h3 className="lp-body">{solution.title}</h3>
              <p className="lp-mono lp-muted">{solution.author}</p>
            </div>
            <Cta link={solution.cta} variant="tertiary" />
          </li>
        ))}
      </ul>
    </section>
  )
}
