import { Lines, Cta, SectionHeading, Tag, type RfpCopy } from './atoms'

export function HowItWorks({ copy }: { copy: RfpCopy['howItWorks'] }) {
  const plan = copy.milestones
  return (
    <section id="how-it-works" className="rfp-how">
      <SectionHeading {...copy} />
      <ol className="rfp-steps">
        {copy.steps.map((step, index) => (
          <li key={step.title}>
            <Tag>{String(index + 1).padStart(2, '0')}</Tag>
            <h3>
              <Lines>{step.title}</Lines>
            </h3>
            <p className="rfp-small">
              <Lines>{step.body}</Lines>
            </p>
          </li>
        ))}
      </ol>
      <div className="rfp-milestones">
        <div className="rfp-milestone-intro">
          <h3 className="rfp-display rfp-medium rfp-milestone-title">
            {plan.heading.split('\n').map((line) => (
              <span key={line}>{line} </span>
            ))}
          </h3>
          <div>
            {plan.body.map((body) => (
              <p key={body}>
                <Lines>{body}</Lines>
              </p>
            ))}
          </div>
          <Cta link={plan.cta} variant="secondary" />
        </div>
        <div className="rfp-plan">
          <div className="rfp-plan-header">
            <p className="rfp-eyebrow">{plan.eyebrow}</p>
            <Tag>{plan.tag}</Tag>
          </div>
          <ol>
            {plan.rows.map((row, index) => (
              <li key={row.title}>
                <span className="rfp-mono rfp-plan-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="rfp-plan-copy">
                  <h4>{row.title}</h4>
                  <p className="rfp-small">{row.body}</p>
                </div>
                <span className="rfp-mono rfp-plan-duration">
                  {row.duration}
                </span>
                <span className="rfp-plan-payout">
                  <Tag outline={index === 3}>
                    {index === 3 ? plan.optional : plan.payout}
                  </Tag>
                </span>
              </li>
            ))}
          </ol>
          <p className="rfp-mono rfp-plan-footnote">{plan.footnote}</p>
        </div>
      </div>
    </section>
  )
}
