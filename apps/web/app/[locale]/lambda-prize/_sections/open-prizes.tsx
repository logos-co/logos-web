import type { LambdaPrize, LambdaPrizeCopySection } from '@repo/content/schemas'

import { Cta, Lines, SectionMeta } from './atoms'

export function OpenPrizes({
  copy,
  prizes,
}: {
  copy: LambdaPrizeCopySection['openPrizes']
  prizes: LambdaPrize[]
}) {
  return (
    <section
      id="open-prizes"
      className="lp-open"
      aria-labelledby="open-heading"
    >
      <SectionMeta copy={copy} />
      <h2 id="open-heading" className="lp-section-heading">
        {copy.heading}
      </h2>
      <div className="lp-prize-grid">
        {prizes.map((prize) => (
          <article
            key={prize.id}
            className={`lp-open-card ${prize.status === 'coming-soon' ? 'lp-coming-soon' : ''}`}
          >
            <div className="lp-card-top">
              <p className="lp-eyebrow">{prize.id}</p>
              <span className="lp-tag lp-mono">{prize.statusLabel}</span>
            </div>
            <div className="lp-open-copy">
              <h3 className="lp-sans-title">
                <Lines>{prize.title}</Lines>
              </h3>
              <p className="lp-small lp-muted">
                <Lines>{prize.body}</Lines>
              </p>
            </div>
            <div className="lp-prize-bottom">
              <p className="lp-display lp-display-small">{prize.amount}</p>
              {prize.cta && <Cta link={prize.cta} variant="tertiary" />}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
