import { LogosMark } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'

export function LocalFirst({ copy }: { copy: Renewal['local'] }) {
  return (
    <section className="bc-light bc-local">
      <h2>{copy.title}</h2>
      <div className="bc-comparison">
        <div className="bc-comparison-labels">
          <div className="bc-comparison-head" />
          {copy.rows.map((row) => (
            <div key={row.label}>{row.label}</div>
          ))}
        </div>
        <div className="bc-comparison-col bc-typical">
          <h3>{copy.typicalTitle}</h3>
          {copy.rows.map((row) => (
            <div key={row.label}>
              <b>×</b>
              {row.typical}
            </div>
          ))}
        </div>
        <div className="bc-comparison-col bc-basecamp">
          <h3>
            <LogosMark size={23} />
            {copy.basecampTitle}
          </h3>
          {copy.rows.map((row) => (
            <div key={row.label}>
              <b>✓</b>
              {row.basecamp}
            </div>
          ))}
        </div>
      </div>
      <div className="bc-comparison-mobile">
        {copy.rows.map((row) => (
          <article key={row.label}>
            <h3>{row.label}</h3>
            <div className="bc-mobile-typical">
              <strong>{copy.typicalTitle}</strong>
              <p>
                <b aria-hidden="true">×</b>
                {row.typical}
              </p>
            </div>
            <div className="bc-mobile-basecamp">
              <strong>{copy.basecampTitle}</strong>
              <p>
                <b aria-hidden="true">✓</b>
                {row.basecamp}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
