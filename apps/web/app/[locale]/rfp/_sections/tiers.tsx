import { Lines, SectionHeading, Tag, type RfpCopy } from './atoms'

export function Tiers({ copy }: { copy: RfpCopy['tiers'] }) {
  return (
    <section id="tiers" className="rfp-tiers rfp-section">
      <SectionHeading {...copy} />
      <div className="rfp-tier-grid">
        {copy.items.map((item) => (
          <article key={item.size}>
            <Tag outline>{copy.tag}</Tag>
            <h3 className="rfp-display">{item.size}</h3>
            <p className="rfp-tier-duration">{item.duration}</p>
            <p className="rfp-eyebrow rfp-muted">{copy.examplesLabel}</p>
            <p className="rfp-small">
              <Lines>{item.examples}</Lines>
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
