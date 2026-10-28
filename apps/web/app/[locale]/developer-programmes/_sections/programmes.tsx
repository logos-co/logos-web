import Image from 'next/image'
import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy, Cta } from './atoms'

export function Programmes({
  programmes,
}: Pick<DeveloperProgrammesCopySection, 'programmes'>) {
  return (
    <section className="dp-programmes">
      {programmes.map((programme) => (
        <article
          key={programme.id}
          className={`dp-programme dp-${programme.id}`}
        >
          <div className="dp-panel">
            <Image
              src={programme.image.src}
              alt={programme.image.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
            {programme.id === 'prize' && <div className="dp-panel-scrim" />}
            <p className="dp-tag dp-eyebrow">{programme.tag}</p>
            {programme.availability && (
              <p className="dp-availability dp-eyebrow">
                {programme.availability}
              </p>
            )}
            <h2 className="dp-panel-title dp-lines">
              <Copy markSize={97.2} fontSize={120}>
                {programme.panelTitle}
              </Copy>
            </h2>
          </div>
          <div className="dp-programme-details">
            <p className="dp-intro">{programme.intro}</p>
            <p className="dp-programme-body dp-lines">{programme.body}</p>
            <dl className="dp-stats">
              {programme.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="dp-eyebrow">{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
            <div className="dp-highlight">
              <p className="dp-eyebrow">{programme.highlight.label}</p>
              <p className="dp-intro">{programme.highlight.title}</p>
              <p className="dp-mono">{programme.highlight.detail}</p>
            </div>
            <ul className="dp-opportunities">
              {programme.opportunities.map((item) => (
                <li key={item.code}>
                  <span className="dp-mono">{item.code}</span>
                  <span>{item.title}</span>
                  <span className="dp-eyebrow">{item.detail}</span>
                </li>
              ))}
            </ul>
            <Cta link={programme.cta} />
          </div>
        </article>
      ))}
    </section>
  )
}
