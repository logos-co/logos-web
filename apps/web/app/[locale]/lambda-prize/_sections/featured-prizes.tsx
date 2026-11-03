import type { LambdaPrize, LambdaPrizeCopySection } from '@repo/content/schemas'
import { ButtonArrowIcon } from '@acid-info/logos-ui'

import { Link } from '@/i18n/navigation'

import { Lines, SectionMeta } from './atoms'
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
          .map((prize) => {
            const content = (
              <>
                {prize.featured && (
                  <div className="lp-featured-image">
                    <Picture
                      image={prize.featured.image}
                      sizes="(min-width: 1120px) calc((100vw - 120px) / 3), (min-width: 768px) calc((100vw - 84px) / 2), calc(100vw - 56px)"
                    />
                    <span className="lp-featured-overlay" aria-hidden="true" />
                    <span className="lp-tag lp-mono">{prize.statusLabel}</span>
                  </div>
                )}
                <div className="lp-featured-copy">
                  <p className="lp-eyebrow">{prize.id}</p>
                  <p className="lp-display lp-amount-featured">
                    {prize.amount}
                  </p>
                  <h3 className="lp-sans-title">
                    <Lines>{prize.title}</Lines>
                  </h3>
                  <p className="lp-small lp-muted">
                    <Lines>{prize.featured?.body ?? prize.body}</Lines>
                  </p>
                </div>
                {prize.cta && (
                  <div className="lp-featured-link">
                    <span className="lp-cta inline-flex items-center justify-center rounded-[4px]">
                      <span className="inline-flex items-center">
                        <span className="font-semibold whitespace-nowrap uppercase">
                          {prize.cta.label}
                        </span>
                        <span className="lp-arrow">
                          <ButtonArrowIcon />
                        </span>
                      </span>
                    </span>
                  </div>
                )}
              </>
            )

            return prize.cta ? (
              <Link
                key={prize.id}
                href={prize.cta.href}
                aria-label={prize.title.replace(/\s+/g, ' ').trim()}
                className="lp-featured-card cursor-pointer"
              >
                {content}
              </Link>
            ) : (
              <article key={prize.id} className="lp-featured-card">
                {content}
              </article>
            )
          })}
      </div>
    </section>
  )
}
