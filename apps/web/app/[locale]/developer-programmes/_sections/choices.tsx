import { ButtonArrowIcon } from '@acid-info/logos-ui'
import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy, Cta } from './atoms'

interface ChoicesProps extends Pick<
  DeveloperProgrammesCopySection,
  'programmes'
> {
  heading: string
  help: DeveloperProgrammesCopySection['choiceHelp']
}

export function Choices({ heading, programmes, help }: ChoicesProps) {
  return (
    <section className="dp-choices">
      <h2 className="dp-section-heading">{heading}</h2>
      <div className="dp-choices-grid">
        {programmes.map((programme) => (
          <article
            key={programme.id}
            className={`dp-choice dp-${programme.id}`}
          >
            <h3>
              <Copy markSize={45.36} fontSize={56}>
                {programme.choice.title}
              </Copy>
            </h3>
            <ul>
              {programme.choice.statements.map((statement) => (
                <li key={statement}>
                  <span className="dp-choice-arrow">
                    <ButtonArrowIcon width={12} height={12} />
                  </span>
                  <span className="dp-lines">{statement}</span>
                </li>
              ))}
            </ul>
            <Cta link={programme.cta} />
          </article>
        ))}
      </div>
      <div className="dp-choice-help dp-mono">
        <p>{help.text}</p>
        <Cta link={help.cta} variant="tertiary" />
      </div>
    </section>
  )
}
