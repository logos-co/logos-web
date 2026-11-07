import { Cta, SectionHeading, type RfpCopy } from './atoms'

export function Terms({ copy }: { copy: RfpCopy['terms'] }) {
  return (
    <section className="rfp-terms rfp-section">
      <SectionHeading {...copy} />
      <div className="rfp-terms-cta">
        <Cta link={copy.cta} variant="tertiary" />
      </div>
      <ol className="rfp-numbered-list">
        {copy.items.map((item, index) => (
          <li key={item}>
            <span className="rfp-mono">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p>{item}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
