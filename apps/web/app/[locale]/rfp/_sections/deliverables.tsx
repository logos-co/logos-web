import { Lines, type RfpCopy } from './atoms'

export function Deliverables({ copy }: { copy: RfpCopy['deliverables'] }) {
  return (
    <section
      id="what-you-ship"
      className="rfp-deliverables"
      data-header-tone="dark"
    >
      <div>
        <p className="rfp-eyebrow">{copy.eyebrow}</p>
        <h2 className="rfp-display">{copy.heading}</h2>
        <p className="rfp-body">
          <Lines>{copy.body}</Lines>
        </p>
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
