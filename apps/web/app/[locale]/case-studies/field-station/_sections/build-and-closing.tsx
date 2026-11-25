import type { FieldStationCaseStudyCopySection } from '@repo/content/schemas'
import { ButtonArrowIcon } from '@/components/ui'
import { Button } from './button'
import { Link } from '@/i18n/navigation'
import { InstallButton } from './install-button'
import { Photo } from './shared'

export function BuildAndClosing({
  build,
  closing,
  fieldStationCta,
}: Pick<FieldStationCaseStudyCopySection, 'build' | 'closing'> & {
  fieldStationCta: FieldStationCaseStudyCopySection['intro']['fieldStationCta']
}) {
  return (
    <>
      <section className="field-case-section field-case-build">
        <div className="field-case-split">
          <Photo image={build.image} reveal />
          <div>
            <h2>{build.title}</h2>
            <p>{build.body}</p>
          </div>
        </div>
        <div className="field-case-split field-case-build-cards">
          {build.cards.map((card, index) => (
            <article
              key={card.title}
              className={index === 0 ? 'field-case-dark' : ''}
            >
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <div className="field-case-actions">
                {index === 0 ? (
                  <InstallButton label={card.ctas[0].label} />
                ) : (
                  card.ctas.map((cta) => (
                    <Button href={cta.href} key={cta.href}>
                      {cta.label}
                    </Button>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        className="field-case-section field-case-dark field-case-closing"
        data-header-tone="dark"
      >
        <div className="field-case-closing-title" data-case-study-reveal>
          <div>
            {closing.left.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <span className="field-case-closing-line" aria-hidden="true" />
          <div>
            {closing.right.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
        <div className="field-case-split field-case-closing-body">
          <div>
            <p>{closing.body}</p>
            <div className="field-case-actions">
              <Button href={fieldStationCta.href}>
                {fieldStationCta.label}
              </Button>
            </div>
          </div>
          <p className="field-case-disclaimer">{closing.disclaimer}</p>
        </div>
        <Link className="field-case-next-link" href={closing.next.href}>
          <span>{closing.nextLabel}</span>
          <strong>{closing.next.label}</strong>
          <ButtonArrowIcon />
        </Link>
      </section>
    </>
  )
}
