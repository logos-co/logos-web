import type { FieldStationCaseStudyCopySection } from '@repo/content/schemas'
import { Paragraphs } from './shared'

export function Technology({
  modules,
  architecture,
}: Pick<FieldStationCaseStudyCopySection, 'modules' | 'architecture'>) {
  return (
    <>
      <section className="field-case-section field-case-grey field-case-split">
        <div>
          <h2>{modules.title}</h2>
          <Paragraphs body={modules.body} />
        </div>
        <div className="field-case-modules">
          {modules.entries.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="field-case-section">
        <div className="field-case-split">
          <h2>{architecture.title}</h2>
          <Paragraphs body={architecture.body} />
        </div>
        <div className="field-case-split field-case-features">
          {architecture.features.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <figure className="field-case-diagram">
          <div className="field-case-diagram-top">
            <div className="field-case-diagram-container">
              <div className="field-case-diagram-label">
                {architecture.basecamp}
              </div>
              <div className="field-case-diagram-container">
                <div className="field-case-diagram-label">
                  {architecture.appsLabel}
                </div>
                <div className="field-case-diagram-apps">
                  {architecture.apps.map((item) => (
                    <article key={item.title}>
                      <h4>{item.title}</h4>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <article className="field-case-diagram-zcash">
              <h4>{architecture.zcash.title}</h4>
              <p>{architecture.zcash.body}</p>
            </article>
          </div>
          <p className="field-case-diagram-loads">{architecture.loads}</p>
          <div className="field-case-diagram-label">
            {architecture.modulesLabel}
          </div>
          <div className="field-case-grid-three field-case-diagram-modules">
            {architecture.modules.map((item) => (
              <article key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <figcaption>{architecture.caption}</figcaption>
        </figure>
      </section>
    </>
  )
}
