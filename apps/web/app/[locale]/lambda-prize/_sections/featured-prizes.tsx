import type { LambdaPrize, LambdaPrizeCopySection } from '@repo/content/schemas'

import { Cta, Lines, SectionMeta } from './atoms'
import { Picture } from './picture'

export function FeaturedPrizes({
  copy,
  prizes,
}: {
  copy: LambdaPrizeCopySection['featured']
  prizes: LambdaPrize[]
}) {
  return (
    <section className="lp-featured" aria-labelledby="featured-heading">
      <SectionMeta copy={copy} />
      <h2 id="featured-heading" className="lp-section-heading">
        {copy.heading}
      </h2>
      <div className="lp-prize-grid">
        {prizes
          .filter((prize) => prize.featured)
          .map((prize) => (
            <article key={prize.id} className="lp-featured-card">
              {prize.featured && (
                <div className="lp-featured-image">
                  <Picture
                    image={prize.featured.image}
                    sizes="(min-width: 1440px) 440px, (min-width: 768px) 50vw, 100vw"
                  />
                  <span className="lp-tag lp-mono">{prize.statusLabel}</span>
                </div>
              )}
              <div className="lp-featured-copy">
                <p className="lp-eyebrow">{prize.id}</p>
                <p className="lp-display lp-amount-featured">{prize.amount}</p>
                <h3 className="lp-sans-title">
                  <Lines>{prize.title}</Lines>
                </h3>
                <p className="lp-small lp-muted">
                  <Lines>{prize.featured?.body ?? prize.body}</Lines>
                </p>
              </div>
              {prize.cta && (
                <div className="lp-featured-link">
                  <Cta link={prize.cta} variant="tertiary" />
                </div>
              )}
            </article>
          ))}
      </div>
    </section>
  )
}
