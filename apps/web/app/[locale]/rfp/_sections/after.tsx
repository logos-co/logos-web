import { Lines, Cta, Photo, Tag, type RfpCopy } from './atoms'

export function After({ copy }: { copy: RfpCopy['after'] }) {
  return (
    <section className="rfp-after">
      <div className="rfp-after-copy">
        <p className="rfp-eyebrow">{copy.eyebrow}</p>
        <h2 className="rfp-display rfp-medium">
          {copy.heading.split('\n').map((line) => (
            <span className="rfp-heading-line" key={line}>
              {line.split(/(?<=\.)\s+/).map((sentence) => (
                <span className="rfp-heading-phrase" key={sentence}>
                  {sentence}{' '}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <p className="rfp-small">
          <Lines>{copy.body}</Lines>
        </p>
        <Cta link={copy.cta} />
      </div>
      <div className="rfp-after-photo">
        <Photo image={copy.image} />
        <span className="rfp-photo-caption">
          <Tag>
            <Lines>{copy.caption}</Lines>
          </Tag>
        </span>
      </div>
    </section>
  )
}
