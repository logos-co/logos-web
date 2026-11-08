import { Lines, Photo, Tag, type RfpCopy } from './atoms'

export function Applicants({ copy }: { copy: RfpCopy['applicants'] }) {
  return (
    <section id="who-should-apply" className="rfp-applicants rfp-section">
      <div className="rfp-applicant-panel">
        <p className="rfp-eyebrow">{copy.eyebrow}</p>
        <h2 className="rfp-display rfp-medium">{copy.heading}</h2>
        <div className="rfp-applicant-body">
          {copy.body.map((body) => (
            <p key={body} className="rfp-small">
              <Lines>{body}</Lines>
            </p>
          ))}
        </div>
        <p className="rfp-eyebrow rfp-muted">{copy.categoriesLabel}</p>
        <div className="rfp-categories">
          {copy.categories.map((category) => (
            <Tag key={category} outline>
              {category}
            </Tag>
          ))}
        </div>
      </div>
      <div className="rfp-applicant-photo">
        <Photo image={copy.image} />
        <span className="rfp-photo-caption">
          <Tag>{copy.caption}</Tag>
        </span>
      </div>
    </section>
  )
}
