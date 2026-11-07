import { Cta, type RfpCopy } from './atoms'

export function FinalCta({ copy }: { copy: RfpCopy['finalCta'] }) {
  return (
    <section className="rfp-final">
      <h2 className="rfp-display">{copy.heading}</h2>
      <div className="rfp-actions">
        <Cta link={copy.primaryCta} />
        <Cta link={copy.secondaryCta} variant="secondary" />
      </div>
    </section>
  )
}
