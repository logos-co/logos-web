import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Cta, DesktopLines } from './atoms'
import { ProgrammeImage } from './programme-image'

interface StatementProps extends Pick<
  DeveloperProgrammesCopySection,
  'programmes'
> {
  mobileEyebrow: string
  copy: DeveloperProgrammesCopySection['statement']
}

export function Statement({ copy, programmes, mobileEyebrow }: StatementProps) {
  return (
    <section className="dp-statement">
      <ProgrammeImage
        src={copy.image.src}
        alt={copy.image.alt}
        sizes="(max-width: 599px) 820px, 100vw"
      />
      <div className="dp-statement-scrim" />
      <p className="dp-statement-eyebrow dp-eyebrow dp-mobile-only">
        {mobileEyebrow}
      </p>
      <h2 className="dp-lines">{copy.title}</h2>
      <div className="dp-statement-copy">
        <p className="dp-desktop-only">
          <DesktopLines>{copy.body}</DesktopLines>
        </p>
        <div className="dp-mobile-statement-body dp-mobile-only">
          {copy.body.split('\n\n').map((paragraph, index) => (
            <p key={index}>
              <DesktopLines>{paragraph}</DesktopLines>
            </p>
          ))}
        </div>
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
