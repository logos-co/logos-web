import Image from 'next/image'
import type { MusterCopySection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { LogosLockup, MusterLockup, Paragraphs } from './shared'

export function Cover({
  hero,
  intro,
}: Pick<MusterCopySection, 'hero' | 'intro'>) {
  const [getBasecamp, build] = intro.ctas

  return (
    <div className="muster-cover muster-dark" data-header-tone="dark">
      <header className="muster-poster">
        <div className="muster-container muster-poster-logos">
          <LogosLockup brand={hero.brand} />
          <span aria-hidden="true">×</span>
          <MusterLockup project={hero.project} light />
        </div>
        <div className="muster-cover-visual">
          <Image
            {...hero.image}
            className="muster-cover-image"
            sizes="(min-width: 1920px) 1920px, 100vw"
            preload
          />
        </div>
        <div className="muster-container muster-cover-heading">
          <h1 className="muster-cover-title">
            {hero.headline[0]}
            <br />
            {hero.headline[1]}
          </h1>
          <p className="muster-cover-note">{hero.note}</p>
        </div>
      </header>
      <section className="muster-intro">
        <div className="muster-container">
          <div className="muster-split">
            <div>
              <h2 className="muster-subheading muster-intro-lead">
                {intro.lead}
              </h2>
              <Paragraphs body={intro.body} />
              <div className="muster-actions">
                <Button
                  href={getBasecamp.href}
                  className="muster-button muster-button-light"
                >
                  {getBasecamp.label}
                </Button>
                <Button
                  href={build.href}
                  variant="secondary"
                  className="muster-button muster-button-outline"
                >
                  {build.label}
                </Button>
              </div>
            </div>
            <Image
              {...intro.image}
              className="muster-photo muster-room-image"
              sizes="(min-width: 768px) 50vw, 100vw"
              data-muster-reveal
            />
          </div>
          <dl className="muster-stats">
            {intro.stats.map(({ title, body }) => (
              <div key={title}>
                <dt className="muster-heading">
                  <span className="sr-only">{title}</span>
                  <span
                    className="muster-stat-value"
                    aria-hidden="true"
                    data-muster-count={title}
                  >
                    {title}
                  </span>
                </dt>
                <dd>{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}
