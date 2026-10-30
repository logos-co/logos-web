import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Cta, Lines } from './atoms'
import { Picture } from './picture'

export function Rules({ copy }: { copy: LambdaPrizeCopySection['rules'] }) {
  return (
    <section className="lp-rules" aria-labelledby="rules-heading">
      <div className="lp-rules-image">
        <Picture
          image={copy.image}
          sizes="(min-width: 1440px) 702px, (min-width: 1120px) 50vw, 100vw"
        />
      </div>
      <div className="lp-rules-panel">
        <div className="lp-rules-heading">
          <p className="lp-eyebrow">{copy.eyebrow}</p>
          <h2 id="rules-heading" className="lp-display lp-display-medium">
            {copy.heading}
          </h2>
          <p className="lp-body">{copy.body}</p>
        </div>
        <dl className="lp-rule-list">
          {copy.rows.map((row) => (
            <div key={row.title}>
              <dt className="lp-body">{row.title}</dt>
              <dd className="lp-small lp-muted">
                <Lines>{row.body}</Lines>
              </dd>
            </div>
          ))}
        </dl>
        <Cta link={copy.cta} variant="tertiary" />
      </div>
    </section>
  )
}
