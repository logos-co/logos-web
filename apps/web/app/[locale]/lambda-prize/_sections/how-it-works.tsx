import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Lines } from './atoms'

export function HowItWorks({
  copy,
}: {
  copy: LambdaPrizeCopySection['howItWorks']
}) {
  return (
    <section id="how-it-works" className="lp-how" aria-labelledby="how-heading">
      <p className="lp-eyebrow">{copy.eyebrow}</p>
      <h2 id="how-heading" className="lp-display lp-display-large">
        {copy.heading}
      </h2>
      <ol className="lp-steps">
        {copy.steps.map((step) => (
          <li key={step.number}>
            <span className="lp-step-number lp-eyebrow">{step.number}</span>
            <div>
              <h3 className="lp-sans-title">{step.title}</h3>
              <p className="lp-small lp-muted">
                <Lines>{step.body}</Lines>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="lp-requirements">
        <div className="lp-requirements-heading">
          <p className="lp-eyebrow">{copy.requirements.eyebrow}</p>
          <h3 className="lp-display lp-display-medium">
            <Lines>{copy.requirements.heading}</Lines>
          </h3>
        </div>
        <div className="lp-requirement-cards">
          {copy.requirements.cards.map((card) => (
            <article key={card.eyebrow} className="lp-requirement-card">
              <p className="lp-eyebrow">{card.eyebrow}</p>
              <h4 className="lp-display lp-display-small">{card.title}</h4>
              <p className="lp-small lp-muted">
                <Lines>{card.body}</Lines>
              </p>
              {card.metrics && (
                <dl>
                  {card.metrics.map((metric) => (
                    <div key={metric.value}>
                      <dt className="lp-eyebrow">{metric.value}</dt>
                      <dd className="lp-small">{metric.label}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          ))}
        </div>
        <p className="lp-mono lp-requirements-note">
          {copy.requirements.footnote}
        </p>
      </div>
    </section>
  )
}
