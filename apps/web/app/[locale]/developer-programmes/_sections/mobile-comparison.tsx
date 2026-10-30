import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy, Cta } from './atoms'

export function MobileComparison({
  programmes,
  mobile,
}: Pick<DeveloperProgrammesCopySection, 'programmes' | 'mobile'>) {
  return (
    <section className="dp-mobile-comparison dp-mobile-only">
      <h2 className="dp-section-heading">{mobile.comparisonHeading}</h2>
      <div className="dp-mobile-compare-card">
        <div className="dp-mobile-compare-header">
          {programmes.map((programme, index) => (
            <div key={programme.id} className={`dp-${programme.id}`}>
              <p className="dp-tag dp-eyebrow">
                {mobile.comparisonTags[index]}
              </p>
              <h3>
                <Copy markSize={20.25} fontSize={25}>
                  {programme.name}
                </Copy>
              </h3>
            </div>
          ))}
        </div>
        <dl>
          {mobile.comparisonRows.map((row) => (
            <div className="dp-mobile-compare-row" key={row.label}>
              <dt className="dp-eyebrow">{row.label}</dt>
              <dd>
                {row.values.map((value, index) => (
                  <p key={programmes[index]!.id}>
                    <span className="sr-only">
                      {programmes[index]!.name.replace('{mark}', 'Lambda ')}
                      :{' '}
                    </span>
                    {value}
                  </p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <div className="dp-mobile-compare-actions">
          {programmes.map((programme) => (
            <div key={programme.id}>
              <Cta link={programme.cta} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
