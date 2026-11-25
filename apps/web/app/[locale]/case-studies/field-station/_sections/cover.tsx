import Image from 'next/image'
import type { FieldStationCaseStudyCopySection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { BrandLockup, Photo } from './shared'
import { InstallButton } from './install-button'

export function Cover({
  hero,
  intro,
}: Pick<FieldStationCaseStudyCopySection, 'hero' | 'intro'>) {
  return (
    <div className="field-case-dark" data-header-tone="dark">
      <header className="field-case-cover muster-poster">
        <div className="field-case-lockup">
          <BrandLockup />
          <span aria-hidden="true">×</span>
          <Image
            src="/campaigns/field-station/zu-grama-logo.svg"
            width={90}
            height={28}
            alt="Zu-Grama"
          />
        </div>
        <div className="muster-cover-visual field-case-cover-visual">
          <Photo
            image={hero.image}
            desktopSrc="/images/field-station-case-study/cover-desktop.webp"
            className="field-case-cover-photo muster-cover-image"
            preload
            fullWidth
          />
        </div>
        <div className="field-case-cover-bottom">
          <h1 className="muster-cover-title">{hero.title}</h1>
          <p className="field-case-label">{hero.label}</p>
        </div>
      </header>
      <section className="field-case-section field-case-intro">
        <div className="field-case-split">
          <h2 className="field-case-subheading">{intro.lead}</h2>
          <div>
            <p>{intro.body}</p>
            <div className="field-case-actions">
              <InstallButton label={intro.installLabel} />
              <Button href={intro.fieldStationCta.href} variant="secondary">
                {intro.fieldStationCta.label}
              </Button>
            </div>
          </div>
        </div>
        <Photo
          image={intro.image}
          className="field-case-intro-photo"
          fullWidth
          reveal
        />
        <dl className="field-case-stats">
          {intro.stats.map((stat) => (
            <div key={stat.title}>
              <dt>
                <span className="sr-only">{stat.title}</span>
                <span
                  aria-hidden="true"
                  className="field-case-stat-value"
                  data-muster-count={stat.title}
                >
                  {stat.title}
                </span>
              </dt>
              <dd>{stat.body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
