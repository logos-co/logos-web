import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Cta, DesktopLines } from './atoms'
import { ProgrammeImage } from './programme-image'

interface StatementProps extends Pick<
  DeveloperProgrammesCopySection,
  'programmes'
> {
  copy: DeveloperProgrammesCopySection['statement']
}

export function Statement({ copy, programmes }: StatementProps) {
  return (
    <section className="dp-statement">
      <ProgrammeImage
        src={copy.image.src}
        alt={copy.image.alt}
        sizes="(max-width: 599px) 820px, 100vw"
      />
      <div className="dp-statement-scrim" />
      <h2 className="dp-lines">{copy.title}</h2>
      <div className="dp-statement-copy">
        <p>
          <DesktopLines>{copy.body}</DesktopLines>
        </p>
        <div className="dp-statement-actions">
          {programmes.map((programme, index) => (
            <Cta
              key={programme.id}
              link={programme.cta}
              inverse
              variant={index === 0 ? 'primary' : 'secondary'}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
