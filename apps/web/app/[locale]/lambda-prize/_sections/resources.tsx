import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Cta, Lines } from './atoms'

export function Resources({
  copy,
}: {
  copy: LambdaPrizeCopySection['resources']
}) {
  return (
    <section className="lp-resources" aria-labelledby="resources-heading">
      <h2 id="resources-heading" className="lp-section-heading">
        {copy.heading}
      </h2>
      <p className="lp-body lp-resource-body">
        <Lines>{copy.body}</Lines>
      </p>
      <div className="lp-resource-grid">
        {copy.items.map((item) => (
          <article key={item.number}>
            <p className="lp-eyebrow">{item.number}</p>
            <div>
              <h3 className="lp-sans-title">{item.title}</h3>
              <Cta link={item.cta} variant="tertiary" />
            </div>
          </article>
        ))}
      </div>
      <aside className="lp-rfp">
        <span className="lp-tag lp-eyebrow">{copy.rfp.label}</span>
        <p className="lp-body">{copy.rfp.body}</p>
        <Cta link={copy.rfp.cta} />
      </aside>
    </section>
  )
}
