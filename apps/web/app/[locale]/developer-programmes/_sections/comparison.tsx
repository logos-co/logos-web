import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy, Cta } from './atoms'

interface ComparisonProps extends Pick<
  DeveloperProgrammesCopySection,
  'programmes'
> {
  heading: string
}

export function Comparison({ heading, programmes }: ComparisonProps) {
  return (
    <section className="dp-comparison dp-desktop-only">
      <h2 className="dp-section-heading">{heading}</h2>
      <div className="dp-comparison-grid">
        {programmes.map((programme) => (
          <article
            key={programme.id}
            className={`dp-comparison-card dp-${programme.id}`}
          >
            <div className="dp-comparison-heading">
              <p className="dp-tag dp-eyebrow">{programme.comparisonTag}</p>
              <h3>
                <Copy markSize={64.8} fontSize={80}>
                  {programme.name}
                </Copy>
              </h3>
            </div>
            <dl>
              {programme.comparison.map((row) => (
                <div key={row.label} className="dp-comparison-row">
                  <dt className="dp-eyebrow">{row.label}</dt>
                  <dd className="dp-lines">{row.body}</dd>
                </div>
              ))}
            </dl>
            <Cta link={programme.cta} />
          </article>
        ))}
      </div>
    </section>
  )
}
