'use client'

import { useState } from 'react'
import { ButtonArrowIcon } from '@acid-info/logos-ui'
import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy, Cta } from './atoms'
import { ProgrammeImage } from './programme-image'

interface MobileProgrammesProps {
  programmes: DeveloperProgrammesCopySection['programmes']
  mobile: DeveloperProgrammesCopySection['mobile']
}

export function MobileProgrammes({
  programmes,
  mobile,
}: MobileProgrammesProps) {
  const [expanded, setExpanded] = useState<string[]>([])

  return (
    <section className="dp-mobile-programmes dp-mobile-only">
      {programmes.map((programme, index) => {
        const open = expanded.includes(programme.id)
        const detailsId = `dp-mobile-${programme.id}-details`
        const image = mobile.programmeImages[index]!
        return (
          <article
            key={programme.id}
            className={`dp-mobile-programme dp-${programme.id}`}
          >
            <div className="dp-mobile-card-header">
              <div className="dp-mobile-card-name">
                <p className="dp-eyebrow">{programme.tag}</p>
                <h2>
                  <Copy markSize={34.02} fontSize={42}>
                    {programme.name}
                  </Copy>
                </h2>
                <p className="dp-mobile-card-intro">{programme.intro}</p>
              </div>
              <div className="dp-mobile-card-image">
                <ProgrammeImage
                  src={image.src}
                  alt={image.alt}
                  sizes="96px"
                  eager
                />
              </div>
            </div>
            <div
              id={detailsId}
              hidden={!open}
              className="dp-mobile-card-details"
            >
              <p className="dp-programme-body">
                <Copy inline markSize={10.64} fontSize={14}>
                  {programme.body}
                </Copy>
              </p>
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
            </div>
            <div className="dp-mobile-card-actions">
              <Cta link={programme.cta} />
              <button
                type="button"
                className="dp-details-toggle cursor-pointer"
                aria-expanded={open}
                aria-controls={detailsId}
                onClick={() =>
                  setExpanded((current) =>
                    open
                      ? current.filter((id) => id !== programme.id)
                      : [...current, programme.id]
                  )
                }
              >
                <span>{open ? mobile.hideDetails : mobile.showDetails}</span>
                <span className="dp-toggle-icon">
                  <ButtonArrowIcon width={12} height={12} />
                </span>
              </button>
            </div>
          </article>
        )
      })}
    </section>
  )
}
